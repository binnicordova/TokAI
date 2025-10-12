import express from 'express';
import * as functionsV2 from 'firebase-functions/v2';
import path from 'path';
import { tiktokHandler } from './server';

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Attach the TikTok handler
app.use('/', tiktokHandler);

export const server = functionsV2.https.onRequest({ timeoutSeconds: 0 }, app);

// app.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });
