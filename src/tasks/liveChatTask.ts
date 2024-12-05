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

            let priorityMessages = [];
            let otherMessages = [];
            let newMessages = [];

            for (const message of messages) {
                if (message.snippet && message.snippet.textMessageDetails) {
                    const text = message.snippet.textMessageDetails?.messageText;
                    const authorChannelId = message.authorDetails?.channelId;

                    // Skip messages sent by the bot itself
                    if (authorChannelId === botUserId) {
                        // console.log('Skipping bot\'s own message'); // debug
                        continue;
                    }

                    // Collect new messages
                    if (text && !messageCache.contains(text)) {
                        newMessages.push(message);
                        if (/Matthew Shields|Matthew|Shields/i.test(text)) {
                            priorityMessages.push(message);
                        } else {
                            otherMessages.push(message);
                        }
                    }
                }
            }

            // Limit the number of replies to 2
            let repliesRemaining = 2;

            // Process priority messages first
            for (const message of priorityMessages) {
                if (repliesRemaining > 0) {
                    const text = message.snippet?.textMessageDetails?.messageText;
                    const authorName = message.authorDetails?.displayName;
                    if (text) {
                        messageCache.add(text);
                        if (authorName) {
                            console.log(`Generating reply for @${authorName}`); // debug
                            const reply = await getGeminiReply(authorName, text);
                            // console.log(`Sending reply: ${reply}`); // debug
                            await sendMessageToLiveChat(liveChatId!, reply);
                            console.log(`Replied to ${authorName} with "${reply}"`); // debug
                            repliesRemaining--;
                        } else {
                            console.log('Author name is not available. Skipping...');
                        }
                    }
                }
            }

            // Process up to 1 random new message if there's remaining quota
            if (repliesRemaining > 0 && otherMessages.length > 0) {
                otherMessages = otherMessages.sort(() => 0.5 - Math.random()).slice(0, 1);
                for (const message of otherMessages) {
                    const text = message.snippet?.textMessageDetails?.messageText;
                    const authorName = message.authorDetails?.displayName;
                    if (text) {
                        messageCache.add(text);
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

            // Store remaining new messages in the cache
            newMessages.forEach(message => {
                const text = message.snippet?.textMessageDetails?.messageText;
                if (text && !messageCache.contains(text)) {
                    messageCache.add(text);
                }
            });

            // Set isFirstRun to false after the first run
            if (isFirstRun) {
                isFirstRun = false;
                console.log('Completed first run, future messages will receive replies'); // debug
            }

            console.log('Waiting for 1 minute before checking again...'); // debug
            await delay(60000); // Wait for 1 minute before checking again
        } catch (error) {
            console.error('Error in live chat task:', error); 
            console.log('Waiting for 1 minute before retrying...'); // debug
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
