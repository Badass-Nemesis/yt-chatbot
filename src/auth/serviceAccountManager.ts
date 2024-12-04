import * as fs from 'fs';
import * as path from 'path';

// Function to get the next service account key path
export const getNextServiceAccountKeyPath = (): string => {
    const serviceAccountDir = path.resolve(__dirname, '../../createServiceAcc/serviceAccounts');
    const serviceAccountFiles = fs.readdirSync(serviceAccountDir).filter(file => file.endsWith('.json'));

    if (serviceAccountFiles.length === 0) {
        throw new Error('No service account key files found.');
    }

    // Logic to select the next service account key, for now we use the first one
    const nextServiceAccountFile = serviceAccountFiles[0];
    return path.join(serviceAccountDir, nextServiceAccountFile);
};

// Ensure this is only used as a utility function
