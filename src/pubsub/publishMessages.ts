import { PubSub } from '@google-cloud/pubsub';
import { config } from 'dotenv';

config(); // Load environment variables from .env

// Initialize Pub/Sub client
const pubSubClient = new PubSub();
const topicName = process.env.PUBSUB_TOPIC_NAME;

if (!topicName) {
    throw new Error('PUBSUB_TOPIC_NAME is not defined in the environment variables.');
}

// Function to publish a message to Pub/Sub
export const publishMessage = async (message: string) => {
    try {
        const dataBuffer = Buffer.from(message);
        const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error('Error publishing message:', error);
    }
};

// Example usage
const exampleMessage = 'Hello, Pub/Sub!';
publishMessage(exampleMessage);
