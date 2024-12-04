import { google, youtube_v3 } from 'googleapis';
import { getNextServiceAccountKeyPath } from '../../auth/serviceAccountManager';
import { GaxiosResponse } from 'gaxios';

// Extract video ID from the given live URL
const extractVideoIdFromUrl = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|live\/|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Function to get the live chat ID from the provided live URL
export const getLiveChatId = async (liveUrl: string): Promise<string | null> => {
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

    try {
        const videoId = extractVideoIdFromUrl(liveUrl);

        if (videoId) {
            const response: GaxiosResponse<youtube_v3.Schema$VideoListResponse> = await youtube.videos.list({
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
