import { google, youtube_v3 } from 'googleapis';
import { PubSub } from '@google-cloud/pubsub';
import { getNextServiceAccountKeyPath } from '../../auth/serviceAccountManager';
import { GaxiosResponse } from 'gaxios';
import { getLiveChatId } from './getLiveChatId';
import { config } from 'dotenv';
import * as path from 'path';

config(); // Load environment variables from .env

// Get the live URL from environment variables
const liveUrl = process.env.LIVE_CHAT_URL;

if (!liveUrl) {
    throw new Error('LIVE_CHAT_URL is not defined in the .env file');
}

// Function to initialize YouTube and PubSub clients
const initializeClients = async () => {
    const keyFilePath = getNextServiceAccountKeyPath();

    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });

    const authClient = await auth.getClient();

    const youtube = google.youtube({
        version: 'v3',
        auth: authClient as any,  // Explicitly cast to any
    });

    const pubSubClient = new PubSub({
        keyFilename: keyFilePath,
    });

    return { youtube, pubSubClient };
};

// Function to fetch live chat messages using service account
export const fetchLiveChatMessages = async (liveChatId: string): Promise<youtube_v3.Schema$LiveChatMessage[]> => {
    const { youtube } = await initializeClients();

    let allMessages: youtube_v3.Schema$LiveChatMessage[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
        try {
            const response: GaxiosResponse<youtube_v3.Schema$LiveChatMessageListResponse> = await youtube.liveChatMessages.list({
                liveChatId: liveChatId,
                part: ['snippet', 'authorDetails'],
                pageToken: nextPageToken,
            });

            const messages = response.data.items || [];
            allMessages = allMessages.concat(messages);
            nextPageToken = response.data.nextPageToken || undefined;
        } catch (error) {
            console.error('Error fetching live chat messages:', error);
            break;
        }
    } while (nextPageToken);

    // Sort messages by publication date (descending)
    allMessages.sort((a, b) => {
        const dateA = new Date(a.snippet?.publishedAt || 0);
        const dateB = new Date(b.snippet?.publishedAt || 0);
        return dateB.getTime() - dateA.getTime();
    });

    return allMessages;
};

// Function to publish live chat messages to Pub/Sub
export const publishLiveChatMessages = async () => {
    const liveChatId = await getLiveChatId(liveUrl);
    if (!liveChatId) {
        console.error('Unable to retrieve live chat ID.');
        return;
    }

    const { pubSubClient } = await initializeClients();

    try {
        const messages = await fetchLiveChatMessages(liveChatId);

        for (const message of messages) {
            const messageData = Buffer.from(JSON.stringify(message));
            await pubSubClient.topic('live-chat-messages').publishMessage({ data: messageData });
            console.log(`Published message: ${message.id}`);
        }
    } catch (error) {
        console.error('Error publishing live chat messages:', error);
    }
};
