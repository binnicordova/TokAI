"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket = (0, socket_io_client_1.io)('http://localhost:3000');
// Example: Listen for TikTok events
socket.on('tiktok:event', (data) => {
    console.log('Received TikTok event:', data);
});
// Example: Join a TikTok room
const username = 'example_username';
socket.emit('join', { username });
// Example: Leave a TikTok room
// socket.emit('leave', { username });
// Handle connection errors
socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
});
