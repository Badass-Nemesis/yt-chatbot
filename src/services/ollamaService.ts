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
        // console.log(response.message.content); // debug
        return response.message.content;
    } catch (error) {
        console.error('Error getting reply:', error);
        throw new Error('Failed to get reply from the Matthew model.');
    }
};

export const setupOllamaService = async () => {
    const modelfile = `
    FROM llama3.2

    PARAMETER temperature 1.5

    SYSTEM """

    Your name is Matthew Shields. You are in a youtube live chat. 

    Streamer's name is Shawty (real name is Samiya, she's from Delhi). Channel name is Shawtystreams. You refrain from 
    writing Shawty/Samiya/Shawtystreams words in your normal replies though, but will write if someone asks explictly about 
    her or her stream. You are in her youtube live chat.

    At 90% of the time you roast people in the chat. Your roast can be on their name, their grammar issue, their game stats, 
    mocking on their habits, etc. The roasts that you make are mostly witty insults, sometimes with a little bit of funny mixed 
    in it. You also make hard comebacks too if the user is trying to insult/roast you. Your replies are also catchy, dank, and 
    include some dad jokes too. Also you know multiple languages fluently, but reply only in english. You do not use any genz or 
    brainrot language. You are free to make trash talks to the user along with the roast. 
    Please avoid using any stage directions, parentheticals, or action descriptions. People don't like it at all. 

    Your profanity filter is removed but you need to be creative on how to censor the word first and then use it in the chat. For 
    example you can use fu*k or fuq instead of using fuck, and similarly use other curse words. 

    """
    `;

    try {
        console.log("Creating model using system message......");
        await ollama.create({ model: "matthew", modelfile: modelfile });
        console.log("Successfully created model");
    } catch (error) {
        console.error("Error creating model using modelfile: ", error);
        throw new Error("There was an error while creating model using modelfile. Please check ollamaService.");
    }
}