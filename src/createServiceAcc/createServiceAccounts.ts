import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Path to your service account key file
const keyFilePath = './src/createServiceAcc/service-account-key.json';

const projectId = 'youtube-live-chat-chatbot';
const serviceAccountCount = 10;
const delayTime = 62000; // Delay time in milliseconds (1 minute 2 seconds)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createServiceAccounts = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient as any });

    const iam = google.iam('v1');

    for (let i = 1; i <= serviceAccountCount; i++) {
        const serviceAccountName = `service-account-${i}`;
        const request = {
            name: `projects/${projectId}`,
            requestBody: {
                accountId: serviceAccountName,
                serviceAccount: {
                    displayName: `Service Account ${i}`,
                },
            },
        };

        try {
            const response = await iam.projects.serviceAccounts.create(request as any);
            const serviceAccount = response.data;

            console.log(`Created service account: ${serviceAccount.email}`);

            // Introduce a delay to ensure the service account is fully available
            await delay(5000);

            // Retry mechanism for key creation
            const maxRetries = 3;
            let attempt = 0;
            let keyCreated = false;

            while (attempt < maxRetries && !keyCreated) {
                try {
                    // Save the service account key to a file
                    const keyRequest = {
                        name: serviceAccount.name as string,
                        requestBody: {},
                    };

                    const keyResponse = await iam.projects.serviceAccounts.keys.create(keyRequest as any);
                    const keyData = keyResponse.data.privateKeyData;
                    if (keyData) {
                        const keyBuffer = Buffer.from(keyData, 'base64');
                        const keyFileName = `${serviceAccountName}-key.json`;
                        fs.writeFileSync(path.join(__dirname, keyFileName), keyBuffer);
                        console.log(`Saved key for ${serviceAccountName} to ${keyFileName}`);
                        keyCreated = true;
                    } else {
                        console.error(`No key data returned for ${serviceAccountName}`);
                    }
                } catch (keyError) {
                    attempt++;
                    console.error(`Error creating key for ${serviceAccountName} (Attempt ${attempt}):`, keyError);
                    if (attempt < maxRetries) {
                        await delay(5000); // Wait before retrying
                    }
                }
            }

            // Wait before creating the next service account
            await delay(delayTime);
        } catch (error) {
            console.error(`Error creating service account ${serviceAccountName}:`, error);
        }
    }
};

createServiceAccounts();
