import { google, youtube_v3 } from 'googleapis';
import { getReadOAuth2Client } from '../auth/readAuthService';

// Extract video ID from the given live URL
const extractVideoIdFromUrl = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|live\/|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Function to get the live chat ID from the provided live URL
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
