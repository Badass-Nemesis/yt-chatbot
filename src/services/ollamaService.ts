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

export const getReply = async (userName: string, message: string): Promise<string> => {
    const maxLength = MAX_REPLY_LENGTH - (userName.length + 3);

    // need to remove those double quotes from the final response
    const prompt = `Keep it within ${maxLength} characters:\nUser: "${message}"\nAI:`;

    try {
        const response = await axios.post<ApiResponse>('http://localhost:11434/api/generate', {
            model: "matthew",
            prompt: prompt,
            stream: false
        });

        // Log the entire response for debugging
        // console.log('API response:', response.data); // debug

        if (!response.data || typeof response.data.response !== 'string') {
            throw new Error('Unexpected response format');
        }

        let reply = response.data.response;

        if (reply.length > maxLength) {
            reply = reply.slice(0, maxLength);
        }

        // tagging the user in the reply
        reply = `@${userName} ${reply}`;

        return reply;
    } catch (error) {
        console.error('Error getting reply:', error);
        throw new Error('Failed to get reply from the Matthew model.');
    }
};