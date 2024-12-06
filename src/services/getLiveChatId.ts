import { google } from 'googleapis';
import { getReadOAuth2Client } from '../auth/readAuthService';

// I just used chatgpt for this and it works perfectly well, for now
const extractVideoIdFromUrl = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|live\/|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

export const getLiveChatId = async (liveUrl: string): Promise<string | null> => {
    const authClient = await getReadOAuth2Client();

    const youtube = google.youtube({
        version: 'v3',
        auth: authClient,
    });

    try {
        const videoId = extractVideoIdFromUrl(liveUrl);

        if (videoId) {
            const response = await youtube.videos.list({
                part: ['liveStreamingDetails'],
                id: [videoId],
            });

            const video = response.data.items?.[0];
            const liveChatId = video?.liveStreamingDetails?.activeLiveChatId;
            if (liveChatId === null || liveChatId === undefined) {
                console.error("Asked for live chat ID, but instead got null/undefined. Tell the dev to check code again");
            }

            return liveChatId as string; // have to write "as string", otherwise TS will freak out
        } else {
            console.error('No video ID extracted from the provided URL.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching live chat ID:', error);
        return null;
    }
};