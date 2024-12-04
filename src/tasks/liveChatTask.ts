import { fetchLiveChatMessages } from '../services/readLiveMessages';
import { sendMessageToLiveChat } from '../services/sendReplies';
import { getLiveChatId } from '../services/getLiveChatId';
import { getWriteOAuth2Client } from '../auth/writeAuthService';
import { delay } from '../utils/delay';
import { CircularBuffer } from '../utils/messageCache';
import { getGeminiReply } from '../services/geminiService';

// Buffer to hold the last 100 messages
const messageCache = new CircularBuffer<string>(100);

const liveUrl = process.env.YOUTUBE_LIVE_URL;
const botUserId = process.env.BOT_USER_ID; // Add your bot's user/channel ID here
let liveChatId: string | null = null;
let isFirstRun = true;

if (!liveUrl) {
    throw new Error('YOUTUBE_LIVE_URL is not defined in the environment variables.');
}

// Function to check token validity
const isTokenValid = async (): Promise<boolean> => {
    try {
        const authClient = await getWriteOAuth2Client();
        const tokenInfo = await authClient.getAccessToken();
        console.log('Token is valid');
        return tokenInfo.token !== null;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

// Function to process live chat messages
const processMessages = async () => {
    while (true) {
        try {
            console.log('Fetching live chat messages...');
            const messages = await fetchLiveChatMessages(liveChatId!);

            if (!messages || messages.length === 0) {
                console.log('No messages found. Retrying...');
                await delay(30000); // Wait for 30 seconds before retrying
                continue;
            }

            for (const message of messages) {
                if (message.snippet && message.snippet.textMessageDetails) {
                    const text = message.snippet.textMessageDetails.messageText;
                    const authorChannelId = message.authorDetails?.channelId;

                    // Skip messages sent by the bot itself
                    if (authorChannelId === botUserId) {
                        // console.log('Skipping bot\'s own message'); // debug
                        continue;
                    }

                    // Store messages in the cache without replying on the first run
                    if (isFirstRun) {
                        // console.log('Caching initial message without reply'); // debug
                        if (text && !messageCache.contains(text)) {
                            messageCache.add(text);
                        }
                    } else {
                        // Process and reply to new messages
                        if (text && !messageCache.contains(text)) {
                            messageCache.add(text);

                            const authorName = message.authorDetails?.displayName;
                            if (authorName) {
                                console.log(`Generating reply for @${authorName}`); // debug
                                const reply = await getGeminiReply(authorName, text);
                                // console.log(`Sending reply: ${reply}`); // debug
                                await sendMessageToLiveChat(liveChatId!, reply);
                                console.log(`Replied to ${authorName} with "${reply}"`); // debug
                            } else {
                                console.log('Author name is not available. Skipping...');
                            }
                        }
                    }
                }
            }

            // Set isFirstRun to false after the first run
            if (isFirstRun) {
                isFirstRun = false;
                console.log('Completed first run, future messages will receive replies');
            }

            console.log('Waiting for 30 seconds before checking again...');
            await delay(30000); // Wait for 30 seconds before checking again
        } catch (error) {
            console.error('Error in live chat task:', error);
            console.log('Waiting for 1 minute before retrying...');
            await delay(60000); // Wait for 1 minute before retrying in case of error
        }
    }
};

// Start live chat task
export const startLiveChatTask = async () => {
    console.log('Starting live chat task...');

    // Check if the token is valid
    const tokenValid = await isTokenValid();
    if (!tokenValid) {
        console.log('Invalid or missing token. Please obtain a valid token.');
        return;
    }

    // Get the live chat ID
    console.log('Retrieving live chat ID...');
    liveChatId = await getLiveChatId(liveUrl);
    if (!liveChatId) {
        console.log('No live chat found. Retrying...');
        await delay(60000); // Wait for 1 minute before retrying
        return;
    }

    console.log('Live chat ID retrieved, starting message processing...');
    // Start processing messages
    await processMessages();
};
