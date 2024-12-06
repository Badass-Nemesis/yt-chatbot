require('dotenv').config();
import app from './app';
import { startLiveChatTask } from './tasks/liveChatTask';
import { setupWriteAuth } from './auth/writeAuthService';
import { setupReadAuth } from './auth/readAuthService';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    app.listen(PORT, async () => {
        console.log(`Server is running on PORT: ${PORT}`);

        try {
            // dont change the sequence
            await setupReadAuth();
            await setupWriteAuth();
            await startLiveChatTask();
        } catch (error) {
            console.error('Error starting the server:', error);
        }
    });
};

startServer();