import { Router } from 'express';
import { getOAuth2Client, setTokens } from '../oauthClient';

const router = Router();

const oauth2Client = getOAuth2Client();

// Generate Auth URL with required scopes
router.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Ensure offline access to get a refresh token
        prompt: 'consent', // Force re-consent to get a refresh token
        scope: [
            'https://www.googleapis.com/auth/youtube.force-ssl', // Required scope to send messages
            'https://www.googleapis.com/auth/youtube.readonly'
        ],
    });
    res.redirect(authUrl);
});

// Handle callback at /oauth2callback
router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code as string;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        setTokens(tokens);

        // Log tokens for verification (remove this in production)
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);

        res.send('Authentication successful! You can now close this window.');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.send('Error during authentication');
    }
});

export default router;
