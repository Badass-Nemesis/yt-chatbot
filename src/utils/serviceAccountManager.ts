import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const loadServiceAccounts = (): string[] => {
    const serviceAccountsDir: string = path.resolve(__dirname, '../serviceAccounts');
    const serviceAccountFiles = fs.readdirSync(serviceAccountsDir)
        .filter(file => /^service-account-\d+\.json$/.test(file)) // filtering out to get only service-account-{number}.json files
        .map(file => path.join(serviceAccountsDir, file));
    return serviceAccountFiles;
};

// getting OAuth2 client for a specific service account json file
const getOAuth2Client = async (keyFilePath: string): Promise<OAuth2Client> => {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });
    return await auth.getClient() as OAuth2Client;
};

const checkQuota = async (authClient: OAuth2Client): Promise<boolean> => {
    const youtube = google.youtube({
        version: 'v3',
        auth: authClient
    }) as youtube_v3.Youtube;

    try {
        // random api call to check quota
        await youtube.videos.list({
            part: ['id'],
            chart: 'mostPopular',
            maxResults: 1
        });

        return true;
    } catch (error: any) {
        if (error.code === 403 && error.errors[0].reason === "quotaExceeded") {
            return false;
        }
        throw error;
    }
};

// checking through all service accounts to get one which has limit
export const getValidOAuth2Client = async (): Promise<OAuth2Client | null> => {
    const serviceAccounts = loadServiceAccounts();
    for (const account of serviceAccounts) {
        const authClient = await getOAuth2Client(account);
        const hasQuota = await checkQuota(authClient);
        if (hasQuota) {
            return authClient;
        }
    }
    return null;
};