import { google, youtube_v3 } from 'googleapis';
import { getReadOAuth2Client } from '../auth/readAuthService';
import { GaxiosResponse } from 'gaxios';
import { delay } from '../utils/delay';

// basically giving a jolt to the service account to wake up
const initializeYouTubeClient = async (): Promise<youtube_v3.Youtube> => {
    const authClient = await getReadOAuth2Client();

    const youtube = google.youtube({
        version: 'v3',
        auth: authClient,
    });

    return youtube;
};

// this is the part of project where I don't understand what types/interface I've used to make TS happy
export const fetchLiveChatMessages = async (liveChatId: string): Promise<youtube_v3.Schema$LiveChatMessage[]> => {
    let youtube = await initializeYouTubeClient();

    let allMessages: youtube_v3.Schema$LiveChatMessage[] = [];
    let nextPageToken: string | undefined = undefined;
    const delayBetweenPages = 5000; // 5 seconds delay

    // hey, I remember you do/while
    do {
        try {
            console.log('Requesting live chat messages...');
            const response: GaxiosResponse<youtube_v3.Schema$LiveChatMessageListResponse> = await youtube.liveChatMessages.list({
                liveChatId,
                part: ['snippet', 'authorDetails'],
                pageToken: nextPageToken,
            });

            console.log('Response received:', response.status, response.statusText);
            const messages = response.data.items || [];
            const totalResults = response.data.pageInfo?.totalResults || 0;
            const resultsPerPage = response.data.pageInfo?.resultsPerPage || 0;

            // fun-fact google still gives nextPageToken even if there's no message/result 
            if (totalResults === 0 && resultsPerPage === 0) {
                console.log('No more messages to fetch. Stopping pagination.');
                break;
            }

            allMessages = allMessages.concat(messages);
            nextPageToken = response.data.nextPageToken || undefined;

            // added a little delay because api was giving error that api refresh is not done
            if (nextPageToken) {
                await delay(delayBetweenPages);
            }

        } catch (error: any) {
            console.error('Error fetching live chat messages:', error);
            if (error.code === 403 && error.errors[0]?.reason === 'quotaExceeded') {
                console.log('Quota exceeded. Reinitializing YouTube client...');
                youtube = await initializeYouTubeClient();
                continue; // fetching messages with new YouTube client next time
            } else {
                await delay(60000); // if the code comes to this, then I am praying to god
                break;
            }
        }
    } while (nextPageToken);

    console.log('Fetched all messages:', allMessages.length); // debug
    return allMessages;
};