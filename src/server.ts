import app from './app';
import { startLiveChatTask } from './tasks/liveChatTask';
import { setupWriteAuth } from './auth/writeAuthService';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    app.listen(PORT, async () => {
        console.log(`Server is running on http://localhost:${PORT}`);

        try {
            // Setup write authentication and start live chat task
            await setupWriteAuth();
            await startLiveChatTask();
        } catch (error) {
            console.error('Error starting the server:', error);
        }
    });
};

startServer();