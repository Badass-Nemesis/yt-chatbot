// going to remove this in phase 3

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
}

const MAX_REPLY_LENGTH = 200; // youtube's max text limit

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getGeminiReply = async (userName: string, message: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

        // fuqing dumb bot, the replies are weak af and if I give a longer prompt then this fella just explodes
        const prompt = `You are an AI assistant in a YouTube live chat known for your wit and humor. Respond to the 
        following message from a user in a catchy, dank, and funny manner. Do not include "AI: " or any other prefix 
        in your response. Keep it within ${MAX_REPLY_LENGTH - (userName.length + 3)} characters:\nUser: "${message}"\nAI:`;

        const result = await model.generateContent([prompt]);

        let geminiReply = result.response.text().trim();

        // ensuring that the gemini's reply is within text limit (including the reply tag/username)
        const maxAllowedLength = MAX_REPLY_LENGTH - (userName.length + 3);
        if (geminiReply.length > maxAllowedLength) {
            geminiReply = geminiReply.substring(0, maxAllowedLength);
        }

        console.log(`Generated reply for @${userName}`);
        console.log(`Reply content: ${geminiReply}`);

        return `@${userName} ${geminiReply}`;
    } catch (error) {
        console.error('Error fetching reply from Gemini:', error);
        return `@${userName} Sorry, I couldn't generate a response right now.`;
    }
};