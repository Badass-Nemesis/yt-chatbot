import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

config(); // Load environment variables from .env

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
}

const MAX_REPLY_LENGTH = 200; // Adjust as per YouTube chat box limit

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to get a reply from Gemini based on the live chat message
export const getGeminiReply = async (userName: string, message: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
        const prompt = `You are an AI assistant in a YouTube live chat. Respond to the following message from a user in a friendly, concise, and conversational manner within ${MAX_REPLY_LENGTH - (userName.length + 3)} characters:\nUser: "${message}"\nAI:`;

        const result = await model.generateContent([prompt]);

        let geminiReply = result.response.text().trim();

        // Ensure the reply length is within the limit, including the reply name tag
        const maxAllowedLength = MAX_REPLY_LENGTH - (userName.length + 3);
        if (geminiReply.length > maxAllowedLength) {
            geminiReply = geminiReply.substring(0, maxAllowedLength);
        }

        return `@${userName} ${geminiReply}`;
    } catch (error) {
        console.error('Error fetching reply from Gemini:', error);
        return `@${userName} Sorry, something's wrong with me. Please contact the dev.`;
    }
};
