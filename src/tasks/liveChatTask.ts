import { fetchLiveChatMessages } from '../services/readLiveMessages';
import { sendMessageToLiveChat } from '../services/sendReplies';
import { getLiveChatId } from '../services/getLiveChatId';
import { getWriteOAuth2Client } from '../auth/writeAuthService';
import { delay } from '../utils/delay';
import { CircularBuffer } from '../utils/messageCache';
import { youtube_v3 } from 'googleapis';
import { getReply } from '../services/ollamaService';

// cache to hold the latest 100 messages
const messageCache = new CircularBuffer(100);

const liveUrl = process.env.YOUTUBE_LIVE_URL;
let botUserId = process.env.BOT_USER_ID;
let liveChatId: string | null = null;
let isFirstRun = true;
const cooldownPeriod = 45;

if (!liveUrl) {
    throw new Error('YOUTUBE_LIVE_URL is not defined in the environment variables.');
}

if (!botUserId) {
    console.log("No bot user id provided. The bot will reply to all messages including itself/own messages");
    botUserId = "";
}

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

// sending reply message for a single message and storing it in the cache
const processSingleMessage = async (message: youtube_v3.Schema$LiveChatMessage, repliesRemaining: number) => {
    const text = message.snippet?.textMessageDetails?.messageText;
    const authorName = message.authorDetails?.displayName;
    if (text && authorName) {
        // messageCache.add({ name: authorName, message: text });
        const chatHistory = messageCache.getMessages();
        const reply = await getReply(authorName, text, chatHistory);
        return { reply, authorName, repliesRemaining: repliesRemaining - 1 };
    }
    return { repliesRemaining };
};

const categorizeMessages = (messages: youtube_v3.Schema$LiveChatMessage[], botUserId: string) => {
    const priorityMessages = [];
    const otherMessages = [];

    for (const message of messages) {
        if (message.snippet && message.snippet.textMessageDetails) {
            const text = message.snippet.textMessageDetails.messageText;
            const authorChannelId = message.authorDetails?.channelId;
            const authorName = message.authorDetails?.displayName;

            if (authorChannelId === botUserId) {
                // console.log("Skipped bot's own message"); // debug
                continue;
            }

            // Cache new messages
            if (text && authorName && !messageCache.contains({ name: authorName, message: text })) {
                messageCache.add({ name: authorName, message: text });
                if (/Matthew Shields|Matthew|Shields/i.test(text)) {
                    priorityMessages.push(message);
                } else {
                    otherMessages.push(message);
                }
            }
        }
    }
    return { priorityMessages, otherMessages };
};

// select a random message from the array without removing it
const getRandomMessage = (messages: any[]) => {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
};

const processMessages = async () => {
    while (true) {
        try {
            // this code is just to make TS happy
            if (!liveChatId || liveChatId === null) {
                console.error("Live chat ID error, it is either null or undefined, dev please check");
                await delay(60000);
                continue;
            }

            console.log('Fetching live chat messages...');
            const messages = await fetchLiveChatMessages(liveChatId);

            if (!messages || messages.length === 0) {
                console.log('No messages found. Retrying...');
                await delay(cooldownPeriod * 1000);// waiting before checking live chat messages
                continue;
            }

            const { priorityMessages, otherMessages } = categorizeMessages(messages, botUserId);

            // skipping all the messages if the server has just started
            if (isFirstRun) {
                isFirstRun = false;
                console.log('Completed first run, future messages will receive replies');
                await sendMessageToLiveChat(liveChatId, "'Like karo bhen ke loro warna raat ko dast lagg jayegi' -by someone");
                console.log("Sent welcome message....");
                continue; // skipping all things below
            }

            let repliesRemaining = 2;
            let replies: { reply: string; authorName: string }[] = [];

            // priority messages
            while (repliesRemaining > 0 && priorityMessages.length > 0) {
                const message = getRandomMessage(priorityMessages);
                const result = await processSingleMessage(message, repliesRemaining);
                if (result.reply) {
                    replies.push({ reply: result.reply, authorName: result.authorName });
                    repliesRemaining = result.repliesRemaining;
                    priorityMessages.splice(priorityMessages.indexOf(message), 1); // removing the selected message
                }
            }

            // other messages
            while (repliesRemaining > 0 && otherMessages.length > 0) {
                const message = getRandomMessage(otherMessages);
                const result = await processSingleMessage(message, repliesRemaining);
                if (result.reply) {
                    replies.push({ reply: result.reply, authorName: result.authorName });
                    repliesRemaining = result.repliesRemaining;
                    otherMessages.splice(otherMessages.indexOf(message), 1); // removing the selected message
                }
            }

            // sending all collected replies with a delay
            for (const { reply, authorName } of replies) {
                await sendMessageToLiveChat(liveChatId, reply);
                console.log(`Replied to ${authorName} with "${reply}"`);
                await delay(3000); // waiting for 3 seconds before sending another reply 
            }

            console.log(`Waiting for ${cooldownPeriod} seconds before checking again...`);
            await delay(cooldownPeriod * 1000); // waiting before checking live chat messages
        } catch (error) {
            console.error('Error in live chat task:', error);
            console.log(`Waiting for ${cooldownPeriod} seconds before retrying...`);
            await delay(cooldownPeriod * 1000); // waiting before retrying
        }
    }
};

// function for server.ts to get the bot started
export const startLiveChatTask = async () => {
    console.log('Starting live chat task...');

    // checking valid write token one more time just in case
    const tokenValid = await isTokenValid();
    if (!tokenValid) {
        console.log('Invalid or missing token. Please obtain a valid token.');
        return;
    }

    console.log('Retrieving live chat ID...');
    liveChatId = await getLiveChatId(liveUrl);
    if (!liveChatId) {
        console.log('No live chat found. Retrying...');
        await delay(60000);
        return;
    }

    // console.log("Live chat id is: " + liveChatId); // debug
    console.log('Live chat ID retrieved, starting processing live chat messages...');
    await processMessages();
};