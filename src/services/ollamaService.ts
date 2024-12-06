import axios from 'axios';

// Define the expected structure of the API response
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

// Set the maximum reply length
const MAX_REPLY_LENGTH = 200;

// Function to get a reply from the Matthew model
export const getReply = async (userName: string, message: string): Promise<string> => {
    // Calculate the maximum allowed length for the reply
    const maxLength = MAX_REPLY_LENGTH - (userName.length + 3);

    // Format the prompt
    const prompt = `Keep it within ${maxLength} characters:\nUser: "${message}"\nAI:`;

    try {
        const response = await axios.post<ApiResponse>('http://localhost:11434/api/generate', {
            model: "matthew",
            prompt: prompt,
            stream: false
        });

        // Log the entire response for debugging
        // console.log('API response:', response.data); // debug

        // Verify that the response contains the expected data
        if (!response.data || typeof response.data.response !== 'string') {
            throw new Error('Unexpected response format');
        }

        // Get the reply from the response data
        let reply = response.data.response;

        // Ensure the reply is within the allowed length
        if (reply.length > maxLength) {
            reply = reply.slice(0, maxLength);
        }

        // Tag the user in the reply
        reply = `@${userName} ${reply}`;

        return reply;
    } catch (error) {
        console.error('Error getting reply:', error);
        throw new Error('Failed to get reply from the Matthew model.');
    }
};
