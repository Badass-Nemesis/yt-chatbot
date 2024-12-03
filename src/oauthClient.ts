import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Load credentials
const credentials = require('./credentials/credentials.json');
const { client_id, client_secret, redirect_uris } = credentials.web;

const oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

// Path to token file
const TOKEN_PATH = path.join(__dirname, 'tokens.json');

// Load tokens from file
const loadTokens = () => {
    if (fs.existsSync(TOKEN_PATH)) {
        const tokenData = fs.readFileSync(TOKEN_PATH, 'utf-8');
        const tokens = JSON.parse(tokenData);
        oauth2Client.setCredentials(tokens);
        console.log('Tokens loaded from file');
    }
};

// Save tokens to file
const saveTokens = (tokens: any) => {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Tokens saved to file');
};

// Initialize by loading tokens from file if available
loadTokens();

const getOAuth2Client = () => {
    return oauth2Client;
};

const setTokens = (tokens: any) => {
    oauth2Client.setCredentials(tokens);
    saveTokens(tokens);
};

export { getOAuth2Client, setTokens };
