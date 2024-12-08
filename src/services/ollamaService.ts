import ollama from 'ollama';

interface ChatMessageInterface {
    name: string,
    message: string
}

const MAX_REPLY_LENGTH = 200;

export const getReply = async (userName: string, message: string, chatHistory: ChatMessageInterface[]): Promise<string> => {
    // creating the history string from chatHistory for easy input to the model
    const historyString = chatHistory.map(singleMessage => {
        return `User ${singleMessage.name} said ${singleMessage.message}`
    }).join("\n");

    // this format works good enough
    const prompt = `Here is the memory of our past conversation:\n${historyString}\n
    Now, please respond to the user's current message: "${message}"\n
    Remember to start your reply with @${userName} so the user is tagged. 
    Do not repeat the user's message. Keep the response within ${MAX_REPLY_LENGTH} characters.`;

    try {
        const response = await ollama.chat({
            model: "matthew",
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
        console.log(response.message.content);
    } catch (error) {
        console.error('Error getting reply:', error);
        throw new Error('Failed to get reply from the Matthew model.');
    }

    return "";
};