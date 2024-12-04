import { PubSub } from '@google-cloud/pubsub';
import { config } from 'dotenv';
import { sendMessageToLiveChat } from '../services/youtube/sendReplies';

config(); // Load environment variables from .env

// Initialize Pub/Sub client
const pubSubClient = new PubSub();
const subscriptionName = 'live-chat-messages-sub';
const subscription = pubSubClient.subscription(subscriptionName);

const messageHandler = async (message: any) => {
    const messageData = JSON.parse(message.data.toString());

    // Prioritize specific commands
    if (messageData.snippet && messageData.snippet.textMessageDetails) {
        const text = messageData.snippet.textMessageDetails.messageText;

        if (text.startsWith('!')) {
            // Handle priority commands
            await handleCommand(text);
        } else {
            // Handle other messages
            await handleOtherMessages(text);
        }
    }

    // Acknowledge the message
    message.ack();
};

const handleCommand = async (text: string) => {
    switch (text) {
        case '!start':
            await sendMessageToLiveChat('Live chat started');
            break;
        case '!stop':
            await sendMessageToLiveChat('Live chat stopped');
            break;
        case '!limit':
            await sendMessageToLiveChat('Message limit reached');
            break;
        default:
            await sendMessageToLiveChat('Unknown command');
            break;
    }
};

const handleOtherMessages = async (text: string) => {
    // Process and handle other non-priority messages
    await sendMessageToLiveChat(`Received message: ${text}`);
};

subscription.on('message', messageHandler);
subscription.on('error', (error: unknown) => {
    if (error instanceof Error) {
        console.error(`Error in subscription: ${error.message}`);
    } else {
        console.error(`Unexpected error in subscription: ${error}`);
    }
});
