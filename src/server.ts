require('dotenv').config();
import express from 'express';
import logger from './utils/logger';
import { authenticate } from './auth/authService';
import { startLiveChatTask } from './tasks/liveChatTask';

const PORT = process.env.PORT || 3000;

const startServer = () => {
    const app = express();

    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        console.log(`Server is running on port ${PORT}`);
    });

    startLiveChatTask();
};

const initializeApp = async () => {
    try {
        const oauth2Client = await authenticate();
        if (oauth2Client.credentials.access_token) {
            startServer();
        } else {
            console.error('Authentication failed: No access token found.');
        }
    } catch (error) {
        console.error('Failed to authenticate:', error);
    }
};

initializeApp();
