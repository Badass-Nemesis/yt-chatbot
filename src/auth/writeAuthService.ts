import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as querystring from 'querystring';

const TOKEN_PATH = path.resolve(__dirname, '../writeToken.json');

export const getWriteOAuth2Client = async (): Promise<OAuth2Client> => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.OAUTH2_CLIENT_ID,
        process.env.OAUTH2_CLIENT_SECRET,
        process.env.OAUTH2_REDIRECT_URI
    );

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));

        // console.log('Loaded tokens:', JSON.parse(token)); // debug

        // this is token refresh logic code, I don't think it is working though
        oAuth2Client.on('tokens', (newTokens) => {
            if (newTokens.refresh_token) {
                const updatedTokens = { ...JSON.parse(token), ...newTokens };
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens));
                console.log('Token updated/refreshed and stored to', TOKEN_PATH); // debug
            }
        });

        return oAuth2Client;
    } else {
        return await getNewToken(oAuth2Client);
    }
};

// if no writeToken.json is present then get user to login and provide the code
const getNewToken = (oAuth2Client: OAuth2Client): Promise<OAuth2Client> => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // important if I want the refresh token
        scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // wrapping it up in a promise makes way more sense than making try/catch like a dumb dev I am
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();

            // need this because "%23" means "/" when decoded
            const decodedCode = querystring.unescape(code);

            oAuth2Client.getToken(decodedCode, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    reject(err);
                }

                // console.log('Generated token:', token); // Log the generated token to verify

                if (token && token.refresh_token) {
                    oAuth2Client.setCredentials(token as any); // fuq it, I'm putting "as any"

                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                    console.log('Token stored to', TOKEN_PATH); // debug
                    resolve(oAuth2Client); 
                } else {
                    console.error('No refresh token received.');
                    reject('No refresh token received.');
                }
            });
        });
    });
};

// just for safety measures, writing this main code instead of directly using 
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
