import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from 'dotenv';
import * as path from 'path';

config(); // Load environment variables from .env

// Function to get OAuth2 client for reading
export const getReadOAuth2Client = async (): Promise<OAuth2Client> => {
    const keyFilePath = path.resolve(__dirname, '../service-account.json'); 

    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });

    const authClient = await auth.getClient() as OAuth2Client;

    return authClient;
};
