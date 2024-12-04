import { google, youtube_v3 } from 'googleapis';
import { getReadOAuth2Client } from '../auth/readAuthService';
import { GaxiosResponse } from 'gaxios';
import { delay } from '../utils/delay';

// Function to initialize YouTube client
const initializeYouTubeClient = async (): Promise<youtube_v3.Youtube> => {
    const authClient = await getReadOAuth2Client();

    const youtube = google.youtube({
        version: 'v3',
        auth: authClient,
    });

    return youtube;
};

// Function to fetch live chat messages using the service account
export const fetchLiveChatMessages = async (liveChatId: string): Promise<youtube_v3.Schema$LiveChatMessage[]> => {
    const youtube = await initializeYouTubeClient();

    let allMessages: youtube_v3.Schema$LiveChatMessage[] = [];
    let nextPageToken: string | undefined = undefined;
    const delayBetweenPages = 5000; // 5 seconds delay between each page fetch

    do {
        try {
            console.log('Requesting live chat messages...');
            const response: GaxiosResponse<youtube_v3.Schema$LiveChatMessageListResponse> = await youtube.liveChatMessages.list({
                liveChatId: liveChatId,
                part: ['snippet', 'authorDetails'],
                pageToken: nextPageToken,
            });

            console.log('Response received:', response.status, response.statusText);
            const messages = response.data.items || [];
            const totalResults = response.data.pageInfo?.totalResults || 0;
            const resultsPerPage = response.data.pageInfo?.resultsPerPage || 0;

            if (totalResults === 0 && resultsPerPage === 0) {
                console.log('No more messages to fetch. Stopping pagination.');
                break;
            }

            allMessages = allMessages.concat(messages);
            nextPageToken = response.data.nextPageToken || undefined;

            // Add a delay between each page fetch to avoid rate limit
            if (nextPageToken) {
                await delay(delayBetweenPages);
            }

        } catch (error) {
            console.error('Error fetching live chat messages:', error);
            await delay(60000); // Wait for 1 minute before retrying in case of error
            break;
        }
    } while (nextPageToken);

    console.log('Fetched all messages:', allMessages.length);
    return allMessages;
};
