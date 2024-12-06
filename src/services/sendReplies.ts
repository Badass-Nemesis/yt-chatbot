import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getWriteOAuth2Client } from '../auth/writeAuthService';

export const sendMessageToLiveChat = async (liveChatId: string, message: string): Promise<void> => {
    const authClient: OAuth2Client = await getWriteOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: authClient });

    try {
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
        // console.log('Message sent:', message); // debug
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
