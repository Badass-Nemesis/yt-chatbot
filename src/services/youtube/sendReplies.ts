import { google, youtube_v3 } from 'googleapis';
import { getOAuth2Client } from '../../auth/authService';
import { config } from 'dotenv';
import { getLiveChatId } from './getLiveChatId';

config(); // Load environment variables from .env

// Get the live URL from environment variables
const liveUrl = process.env.LIVE_CHAT_URL;

if (!liveUrl) {
    throw new Error('LIVE_CHAT_URL is not defined in the .env file');
}

// Function to send a message to the live chat
export const sendMessageToLiveChat = async (message: string): Promise<void> => {
    const oauth2Client = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const liveChatId = await getLiveChatId(liveUrl);
        if (!liveChatId) {
            console.error('Unable to retrieve live chat ID.');
            return;
        }

        await youtube.liveChatMessages.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    liveChatId: liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: {
                        messageText: message,
                    },
                },
            },
        });
        console.log('Message sent:', message);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
