import axios from 'axios';

// API response according to the documentation of ollama
interface ApiResponse {
    response: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
    context?: number[];
}

const MAX_REPLY_LENGTH = 200;

export const getReply = async (userName: string, message: string, chatHistory: { name: string; message: string }[]): Promise<string> => {
    // creating the history string from chatHistory for easy input to the model
    const historyString = chatHistory.map(item => `User: "${item.name}" said: "${item.message}"`).join("\n");

    // this format works good enough
    const prompt = `Here is the memory of our past conversation:\n${historyString}\nNow, please respond 
    to the user's current message: "${message}"\nRemember to start your reply with @${userName} so the user 
    is tagged. Do not repeat the user's message. Keep the response within ${MAX_REPLY_LENGTH} characters.`;

    try {
        const response = await axios.post<ApiResponse>('http://localhost:11434/api/generate', {
            model: "matthew",
            prompt: prompt,
            stream: false
        });

        // console.log('API response:', response.data); // debug

        if (!response.data || typeof response.data.response !== 'string') {
            throw new Error('Unexpected response format');
        }

        // removing double quotes from the response given by ollama model
        let reply = response.data.response.replace(/"/g, '');

        return reply;
    } catch (error) {
        console.error('Error getting reply:', error);
        throw new Error('Failed to get reply from the Matthew model.');
    }
};