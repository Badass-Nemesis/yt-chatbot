import { Router, Request, Response } from 'express';
import { google, youtube_v3 } from 'googleapis';
import { getOAuth2Client } from '../oauthClient';

const router = Router();

const oauth2Client = getOAuth2Client();
const botUserChannelId = 'UCTj-CYX2yIEs-EMNm-YCAJg'; // Bot user's channel ID

// Function to extract video ID from YouTube live stream link
const extractVideoIdFromLiveUrl = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Endpoint to get live chat ID from YouTube live stream link
router.get('/livechat-id', async (req: Request, res: Response): Promise<void> => {
    const youtubeLink = req.query.url as string;
    const videoId = extractVideoIdFromLiveUrl(youtubeLink);

    if (!videoId) {
        res.status(400).send('Invalid YouTube live stream URL');
        return;
    }

    try {
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const response = await youtube.videos.list({
            part: ['liveStreamingDetails'],
            id: [videoId],
        });

        const video = (response.data as youtube_v3.Schema$VideoListResponse).items?.[0];
        if (video && video.liveStreamingDetails) {
            const liveChatId = video.liveStreamingDetails.activeLiveChatId;
            res.json({ liveChatId });
        } else {
            res.status(404).send('No live chat found for the given video ID.');
        }
    } catch (error) {
        res.status(500).send('Error fetching live chat ID');
    }
});

// Endpoint to fetch and respond to live chat messages
router.get('/send-message', async (req: Request, res: Response): Promise<void> => {
    const liveChatId = req.query.liveChatId as string || "Cg0KCzhFdnFhNk5EUVFnKicKGFVDVkVnUXhna2xyVW9TbEREX01INkVfdxILOEV2cWE2TkRRUWc";

    if (!liveChatId) {
        res.status(400).send('Live Chat ID is required.');
        return;
    }

    try {
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const response = await youtube.liveChatMessages.list({
            liveChatId: liveChatId,
            part: ['snippet', 'authorDetails'],
        });

        const messages = response.data.items;
        if (!messages || messages.length === 0) {
            res.status(404).send('No messages found.');
            return;
        }

        // Filter out bot user's own messages
        const otherMessages = messages.filter(msg => msg.authorDetails && msg.authorDetails.channelId !== botUserChannelId);

        if (otherMessages.length === 0) {
            res.status(404).send('No other messages found.');
            return;
        }

        // Select the first message and respond to it
        const selectedMessage = otherMessages[0];
        const authorDetails = selectedMessage.authorDetails;
        const authorName = authorDetails?.displayName;

        if (!authorName) {
            res.status(500).send('Author name is not available.');
            return;
        }

        // Send a "Hello World" message tagging the author
        await youtube.liveChatMessages.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    liveChatId: liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: {
                        messageText: `@${authorName} Hello World!`,
                    },
                },
            },
        });

        res.send('Message sent!');
    } catch (error) {
        res.status(500).send('Error fetching or sending live chat message');
    }
});

export default router;
