import { getValidOAuth2Client } from '../utils/serviceAccountManager';
import { OAuth2Client } from 'google-auth-library';

export const getReadOAuth2Client = async (): Promise<OAuth2Client> => {
    try {
        const authClient = await getValidOAuth2Client();
        if (authClient) {
            console.log("Read OAuth2 client retrieved successfully.");
            return authClient;
        } else {
            console.error("No valid service accounts found.");
            throw new Error("No valid service accounts found.");
        }
    } catch (error) {
        console.error("Error getting OAuth2 client:", error);
        throw error;
    }
};

// this function is only for server.ts to use
export const setupReadAuth = async (): Promise<OAuth2Client | null> => {
    try {
        const authClient = await getValidOAuth2Client();
        if (authClient) {
            console.log("Read OAuth2 client setup successfully.");
        } else {
            console.error("No valid service accounts found.");
        }
        return authClient;
    } catch (error) {
        console.error("Error setting up read OAuth2 client:", error);
        return null;
    }
};
