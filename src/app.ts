import express from 'express';
import authRoutes from './routes/auth';
import youtubeRoutes from './routes/youtube';

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use(authRoutes);
app.use(youtubeRoutes);

export default app;
