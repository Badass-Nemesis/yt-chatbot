import { fetchLiveChatMessages, sendMessageToLiveChat, getLiveChatId } from '../services/youtubeService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const liveUrl = process.env.YOUTUBE_LIVE_URL; // Get the live URL from environment variables
let liveChatId: string | null = null;

if (!liveUrl) {
    throw new Error('YOUTUBE_LIVE_URL is not defined in the environment variables.');
}

const checkLiveChatMessages = async () => {
    // Get and store live chat ID once
    if (!liveChatId) {
        liveChatId = await getLiveChatId(liveUrl);
        if (!liveChatId) {
            console.log('No live chat found. Retrying...');
            await delay(3600000); // Wait for 1 hour before retrying
            return;
        }
    }

    while (true) {
        try {
            const messages = await fetchLiveChatMessages(liveChatId);

            if (!messages || messages.length === 0) {
                console.log('No messages found. Retrying...');
                await delay(15000); // Wait for 15 seconds before retrying
                continue;
            }

            // Log all fetched messages for debugging
            // debug
            // messages.forEach(msg => {
            //     console.log(`Fetched Message - ID: ${msg.id}, Published At: ${msg.snippet?.publishedAt}, Author: ${msg.authorDetails?.displayName}`);
            // });

            // Check if there's any message from the bot and remove them from the main messages list
            const botMessages = messages.filter(
                (msg: any) => msg.authorDetails && msg.authorDetails.channelId === process.env.BOT_USER_CHANNEL_ID
            );

            const nonBotMessages = messages.filter(
                (msg: any) => msg.authorDetails && msg.authorDetails.channelId !== process.env.BOT_USER_CHANNEL_ID
            );

            // Log all bot messages for debugging
            // debug
            // botMessages.forEach(msg => {
            //     console.log(`Bot Message - ID: ${msg.id}, Published At: ${msg.snippet?.publishedAt}, Author: ${msg.authorDetails?.displayName}`);
            // });

            let newMessages = nonBotMessages;

            if (botMessages.length > 0) {
                const latestBotMessage = botMessages[0]; // Latest bot message is at the top after sorting
                if (latestBotMessage.snippet && latestBotMessage.snippet.publishedAt) {
                    const latestBotMessageDate = new Date(latestBotMessage.snippet.publishedAt);
                    newMessages = nonBotMessages.filter(
                        (msg: any) =>
                            msg.snippet &&
                            msg.snippet.publishedAt &&
                            new Date(msg.snippet.publishedAt) > latestBotMessageDate
                    );

                    // Log filtered new messages for debugging
                    // debug
                    newMessages.forEach(msg => {
                        console.log(`New Message After Bot - ID: ${msg.id}, Published At: ${msg.snippet?.publishedAt}, Author: ${msg.authorDetails?.displayName}`);
                    });
                }
            }

            if (newMessages.length === 0) {
                console.log('No new other messages found. Retrying...');
                await delay(15000); // Wait for 15 seconds before retrying
                continue;
            }

            // Limit the number of replies to a manageable number
            const replyMessages = newMessages.slice(0, 3); // Adjust the number of replies as needed

            for (const selectedMessage of replyMessages) {
                const authorDetails = selectedMessage.authorDetails;
                const authorName = authorDetails?.displayName;

                if (authorName) {
                    await sendMessageToLiveChat(liveChatId, `@${authorName} Hello World!`);
                    console.log(`Replied to ${authorName} with "Hello World!"`);
                } else {
                    console.log('Author name is not available. Skipping...');
                }

                await delay(15000); // Wait for 15 seconds before checking again
            }
        } catch (error) {
            console.error('Error in live chat task:', error);
            await delay(60000); // Wait for 1 minute before retrying in case of error
        }
    }
};

const startLiveChatTask = () => {
    console.log('Starting live chat task...');
    checkLiveChatMessages();
};

export { startLiveChatTask };