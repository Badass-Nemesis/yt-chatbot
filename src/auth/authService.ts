import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Load environment variables
require('dotenv').config();

const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.NODE_ENV === 'production' ? process.env.GOOGLE_REDIRECT_URI_PROD : process.env.GOOGLE_REDIRECT_URI]
};

const oauth2Client = new OAuth2Client(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);

// Path to token file
const TOKEN_PATH = path.resolve(__dirname, '../tokens.json');

// Load tokens from file
const loadTokens = () => {
    if (fs.existsSync(TOKEN_PATH)) {
        const tokenData = fs.readFileSync(TOKEN_PATH, 'utf-8');
        const tokens = JSON.parse(tokenData);
        oauth2Client.setCredentials(tokens);
        // console.log('Tokens loaded from file:', tokens);
    } else {
        console.log('No tokens found. Please authenticate.');
    }
};

// Save tokens to file
const saveTokens = (tokens: any) => {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    // console.log('Tokens saved to file:', tokens);
};

// Function to get new tokens and save them
const getNewTokens = async (): Promise<void> => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/youtube.readonly'
        ],
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close();
            try {
                const decodedCode = decodeURIComponent(code.trim());

                const { tokens } = await oauth2Client.getToken(decodedCode);

                if (!tokens.refresh_token) {
                    throw new Error('No refresh token received.');
                }

                saveTokens(tokens);
                oauth2Client.setCredentials(tokens);
                console.log('Authorization successful!');
                resolve();
            } catch (error) {
                console.error('Error during authentication:', error);
                reject(error);
            }
        });
    });
};

const authenticate = async () => {
    loadTokens();
    if (!oauth2Client.credentials.access_token) {
        await getNewTokens();
    }
    // console.log('OAuth2Client credentials after loading tokens:', oauth2Client.credentials);
    return oauth2Client;
};

const getOAuth2Client = () => {
    return oauth2Client;
};

export { getOAuth2Client, authenticate };
