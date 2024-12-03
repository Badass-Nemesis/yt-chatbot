import { google, youtube_v3 } from 'googleapis';
import { getOAuth2Client } from './authService';
import { GaxiosResponse } from 'gaxios';

// Extract video ID from the given live URL
const extractVideoIdFromUrl = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|live\/|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Function to get the live chat ID from the provided live URL
export const getLiveChatId = async (liveUrl: string): Promise<string | null> => {
    const oauth2Client = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const videoId = extractVideoIdFromUrl(liveUrl);
        // console.log(`Extracted video ID: ${videoId}`);

        if (videoId) {
            const response: GaxiosResponse<youtube_v3.Schema$VideoListResponse> = await youtube.videos.list({
                part: ['liveStreamingDetails'],
                id: [videoId]
            });
            // console.log('Video response:', response.data);

            const video = response.data.items?.[0];
            const liveChatId = video?.liveStreamingDetails?.activeLiveChatId;
            // console.log('Live chat ID:', liveChatId);

            return liveChatId || null;
        } else {
            console.error('No video ID extracted from the provided URL.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching live chat ID:', error);
        return null;
    }
};

// Function to fetch all live chat messages until the end
export const fetchLiveChatMessages = async (liveChatId: string): Promise<youtube_v3.Schema$LiveChatMessage[] | null> => {
    const oauth2Client = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    let allMessages: youtube_v3.Schema$LiveChatMessage[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
        try {
            const response: GaxiosResponse<youtube_v3.Schema$LiveChatMessageListResponse> = await youtube.liveChatMessages.list({
                liveChatId: liveChatId,
                part: ['snippet', 'authorDetails'],
                pageToken: nextPageToken
            });
            // console.log('Live chat messages response:', response.data);

            const messages = response.data.items;
            if (messages && messages.length > 0) {
                allMessages = allMessages.concat(messages);
                nextPageToken = response.data.nextPageToken || undefined; // Ensure nextPageToken is either string or undefined
            } else {
                // Stop fetching if there are no messages
                break;
            }
        } catch (error) {
            console.error('Error fetching live chat messages:', error);
            return null;
        }
    } while (nextPageToken);

    // Sort messages by publication date (descending)
    allMessages.sort((a, b) => {
        const dateA = new Date(a.snippet?.publishedAt || 0);
        const dateB = new Date(b.snippet?.publishedAt || 0);
        return dateB.getTime() - dateA.getTime();
    });

    // Return all messages
    return allMessages;
};

// Function to send a message to the live chat
export const sendMessageToLiveChat = async (liveChatId: string, message: string): Promise<void> => {
    const oauth2Client = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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
        console.log('Message sent:', message);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
