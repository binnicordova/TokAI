"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokHandler = void 0;
// use require to avoid TS type resolution issues for socket.io in this repo
const { Server: IOServer } = require('socket.io');
// TikTok-Live-Connector does not have perfect TypeScript types in this project; require it.
const { TikTokLiveConnection } = require('tiktok-live-connector');
// EVENTS we forward
const EVENTS = [
    'chat',
    'gift',
    'like',
    'follow',
    'roomUser',
    'roomUserLeave',
    'streamStart',
    'streamEnd',
    'connect',
    'disconnected',
    'error'
];
// Create and attach a Socket.IO instance to the provided Node HTTP server (only once)
const attachIOToServer = (httpServer) => {
    if (httpServer.__tiktok_io)
        return httpServer.__tiktok_io;
    const io = new IOServer(httpServer, {
        cors: {
            origin: '*', // Allow all origins for development purposes
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'] // Ensure WebSocket transport is enabled
    });
    // Map username -> { conn, refCount }
    const connections = new Map();
    const makeForwarder = (username, eventName) => (payload) => {
        console.log(`Forwarding event '${eventName}' for user '${username}' with payload:`, payload);
        io.to(username).emit('tiktok:event', { event: eventName, data: payload });
    };
    const buildConnection = (username) => {
        console.log(`Building connection for user: ${username}`);
        const connection = new TikTokLiveConnection(username);
        EVENTS.forEach((evt) => connection.on(evt, makeForwarder(username, evt)));
        connection.connect?.().catch((err) => {
            io.to(username).emit('tiktok:error', { message: 'connect_failed', error: String(err) });
            console.error(`Failed to connect for user '${username}':`, err);
        });
        return connection;
    };
    const ensureConnection = (username) => {
        console.log(`Ensuring connection for user: ${username}`);
        const existing = connections.get(username);
        if (existing) {
            existing.refCount += 1;
            return existing.conn;
        }
        const conn = buildConnection(username);
        connections.set(username, { conn, refCount: 1 });
        return conn;
    };
    const releaseConnection = (username) => {
        console.log(`Releasing connection for user: ${username}`);
        const entry = connections.get(username);
        if (!entry)
            return;
        entry.refCount -= 1;
        if (entry.refCount <= 0) {
            try {
                entry.conn.disconnect();
            }
            catch (_e) {
                // ignore
            }
            connections.delete(username);
            io.to(username).emit('tiktok:closed', { username });
        }
    };
    const joinRoom = (socket, username) => {
        if (!username || typeof username !== 'string')
            return;
        socket.join(username);
        socket.data = socket.data || {};
        socket.data.subscriptions = socket.data.subscriptions || new Set();
        if (!socket.data.subscriptions.has(username)) {
            socket.data.subscriptions.add(username);
            ensureConnection(username);
        }
        console.log(`User '${username}' joined room.`);
    };
    const leaveRoom = (socket, username) => {
        if (!username || typeof username !== 'string')
            return;
        socket.leave(username);
        if (socket.data?.subscriptions?.has(username)) {
            socket.data.subscriptions.delete(username);
            releaseConnection(username);
        }
        console.log(`User '${username}' left room.`);
    };
    io.on('connection', (socket) => {
        console.log('Socket.IO connection established.');
        socket.on('join', (...args) => {
            const payload = args[0];
            const username = payload && typeof payload.username === 'string' ? payload.username : undefined;
            if (username)
                joinRoom(socket, username);
        });
        socket.on('leave', (...args) => {
            const payload = args[0];
            const username = payload && typeof payload.username === 'string' ? payload.username : undefined;
            if (username)
                leaveRoom(socket, username);
        });
        socket.on('disconnect', () => {
            console.log('Socket disconnected. Cleaning up subscriptions.');
            const subs = socket.data?.subscriptions || new Set();
            subs.forEach((u) => releaseConnection(u));
        });
        socket.on('error', (err) => {
            console.error('Socket.IO connection error:', err);
        });
    });
    // expose internals on server for testing/debug if needed
    httpServer.__tiktok_io = io;
    httpServer.__tiktok_connections = connections;
    return io;
};
// Firebase onRequest-compatible handler. On first invocation it will attach Socket.IO to
// the underlying Node server object available at req.socket.server and reuse it after.
const tiktokHandler = (req, res) => {
    const underlying = req.socket.server;
    if (!underlying) {
        res.status(500).send('No underlying server available to attach socket.io');
        return;
    }
    try {
        attachIOToServer(underlying);
        res.status(200).send('tiktok-socket ready');
    }
    catch (err) {
        console.error('Failed to attach io', err);
        res.status(500).send('failed to initialize');
    }
};
exports.tiktokHandler = tiktokHandler;
