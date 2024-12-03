import express from 'express';
import bodyParser from 'body-parser';
import { startLiveChatTask } from './tasks/liveChatTask';

const app = express();

// Middleware
app.use(bodyParser.json());

// Start live chat task
startLiveChatTask();

export default app;
