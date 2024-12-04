import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as querystring from 'querystring';

config(); // Load environment variables from .env

const TOKEN_PATH = path.resolve(__dirname, '../writeToken.json'); // Adjusted path

// Function to get OAuth2 client for writing
export const getWriteOAuth2Client = async (): Promise<OAuth2Client> => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.OAUTH2_CLIENT_ID,
        process.env.OAUTH2_CLIENT_SECRET,
        process.env.OAUTH2_REDIRECT_URI
    );

    // Check if we already have the token stored
    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));

        // Log the loaded tokens to check for refresh token
        // console.log('Loaded tokens:', JSON.parse(token));

        // Set up token refresh logic
        oAuth2Client.on('tokens', (newTokens) => {
            if (newTokens.refresh_token) {
                const updatedTokens = { ...JSON.parse(token), ...newTokens };
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens));
                console.log('Token updated and stored to', TOKEN_PATH);
            }
        });

        return oAuth2Client;
    } else {
        return await getNewToken(oAuth2Client);
    }
};

// Function to generate a new token
const getNewToken = (oAuth2Client: OAuth2Client): Promise<OAuth2Client> => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', 
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            
            // Decode the URL-encoded authorization code
            const decodedCode = querystring.unescape(code);

            oAuth2Client.getToken(decodedCode, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    reject(err);
                }

                // console.log('Generated token:', token); // Log the generated token to verify

                if (token && token.refresh_token) {
                    oAuth2Client.setCredentials(token as any);

                    // Store the token to disk for later program executions
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                    console.log('Token stored to', TOKEN_PATH);
                    resolve(oAuth2Client);
                } else {
                    console.error('No refresh token received.');
                    reject('No refresh token received.');
                }
            });
        });
    });
};

// Function to setup write authentication and return the client
export const setupWriteAuth = async (): Promise<OAuth2Client | null> => {
    try {
        const oAuth2Client = await getWriteOAuth2Client();
        console.log('Write OAuth2 client setup successfully.');
        return oAuth2Client;
    } catch (error) {
        console.error('Error setting up write OAuth2 client:', error);
        return null;
    }
};
