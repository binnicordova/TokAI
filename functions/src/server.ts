import type { Server as HttpServer } from 'http';
import type { Request, Response } from 'express';
// use require to avoid TS type resolution issues for socket.io in this repo
const { Server: IOServer } = require('socket.io');
// TikTok-Live-Connector does not have perfect TypeScript types in this project; require it.
const { TikTokLiveConnection, SignConfig } = require('tiktok-live-connector');

// Configure SignConfig for tiktok-live-connector with apiKey, basePath, and custom header.
// SignConfig.apiKey = ""; // An API key created at https://www.eulerstream.com
// // SignConfig.basePath = "https://your-custom-sign-server.com";
// SignConfig.baseOptions = SignConfig.baseOptions || {};
// SignConfig.baseOptions.headers = SignConfig.baseOptions.headers || {};
// SignConfig.baseOptions.headers['X-Custom-Header'] = 'Custom-Header-Value';

// lightweight types to avoid using `any` throughout the file
type TikTokConnectionLike = {
	on: (event: string, handler: (payload: unknown) => void) => void;
	connect?: () => Promise<void>;
	disconnect: () => void;
};

type SocketLike = {
	id: string; // Add the 'id' property to match the usage
	join: (room: string) => void;
	leave: (room: string) => void;
	data?: { subscriptions?: Set<string> };
	on: <T = unknown>(event: string, handler: (payload: T) => void) => void; // Refine the 'on' method type
};

// Extend Node HTTP server with debug hooks we attach
type HttpServerWithIO = HttpServer & {
	__tiktok_io?: unknown;
	__tiktok_connections?: Map<string, { conn: TikTokConnectionLike; refCount: number }>;
};

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
const attachIOToServer = (httpServer: HttpServerWithIO) => {
	if (httpServer.__tiktok_io) return httpServer.__tiktok_io as unknown;

	const io = new IOServer(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
			credentials: false
		},
		transports: ['websocket']
	});

	io.on('connection', (socket: SocketLike) => {
		console.log('A client connected:', socket.id);

		socket.on('join', ({ username }: { username: string }) => {
			console.log(`User joined: ${username}`);
			socket.join(username);
		});

		socket.on('leave', ({ username }: { username: string }) => {
			console.log(`User left: ${username}`);
			socket.leave(username);
		});

		socket.on('disconnect', () => {
			console.log('A client disconnected:', socket.id);
		});
	});

	// Map username -> { conn, refCount }
	const connections = new Map<string, { conn: TikTokConnectionLike; refCount: number }>();

	// Define how to filter/map fields for each event type
	const eventFieldMapper: Record<string, (payload: any) => any> = {
		chat: (payload) => ({
			userId: payload?.user?.userId,
			comment: payload?.comment,
			user: payload?.user?.nickname,
			// profilePictureUrl: payload?.user?.profilePicture?.url || payload?.profilePictureUrl,
		}),
		like: (payload) => ({
			userId: payload?.user?.userId,
			likeCount: payload?.likeCount,
			totalLikeCount: payload?.totalLikeCount,
			user: payload?.user?.nickname,
		}),
		gift: (payload) => ({
			userId: payload?.user?.userId,
			user: payload?.user?.nickname,
			repeatCount: payload?.repeatCount,
			giftId: payload?.giftId,
			// // profilePictureUrl: payload?.user?.profilePicture?.url || payload?.profilePictureUrl,
		}),
		member: (payload) => ({
			userId: payload?.user?.userId,
			user: payload?.user?.nickname,
			// // profilePictureUrl: payload?.user?.profilePicture?.url || payload?.profilePictureUrl,
			joined: true,
		}),
		social: (payload) => ({
			userId: payload?.user?.userId,
			user: payload?.user?.nickname,
			displayType: payload?.displayType,
			label: payload?.label,
		}),
		follow: (payload) => ({
			userId: payload?.user?.userId,
			user: payload?.user?.nickname,
		}),
		roomUser: (payload) => ({
			viewerCount: payload?.viewerCount,
		}),
		roomUserLeave: (payload) => ({
			userId: payload?.user?.userId,
			user: payload?.user?.nickname,
		}),
		streamStart: (_payload) => ({ started: true }),
		streamEnd: (_payload) => ({ ended: true }),
		connect: (_payload) => ({ connected: true }),
		disconnected: (_payload) => ({ disconnected: true }),
		error: (payload) => ({ error: payload }),
	};

	const makeForwarder = (username: string, eventName: string) => (payload: unknown) => {
		const mapper = eventFieldMapper[eventName];
		const filtered = mapper ? mapper(payload) : payload;
		console.log(`Forwarding event '${eventName}' for user '${username}'`);
		io.to(username).emit('tiktok:event', { event: eventName, data: filtered });
	};

	const buildConnection = (username: string) => {
		console.log(`Building connection for user: ${username}`);
		const connection: TikTokConnectionLike = new TikTokLiveConnection(username);
		EVENTS.forEach((evt: string) => connection.on(evt, makeForwarder(username, evt)));
		connection.connect?.().catch((err: unknown) => {
			io.to(username).emit('tiktok:error', { message: 'connect_failed', error: String(err) });
			console.error(`Failed to connect for user '${username}':`, err);
		});
		return connection;
	};

	const ensureConnection = (username: string) => {
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

	const releaseConnection = (username: string) => {
		console.log(`Releasing connection for user: ${username}`);
		const entry = connections.get(username);
		if (!entry) return;
		entry.refCount -= 1;
		if (entry.refCount <= 0) {
			try {
				entry.conn.disconnect();
			} catch (_e) {
				// ignore
			}
			connections.delete(username);
			io.to(username).emit('tiktok:closed', { username });
		}
	};

	const joinRoom = (socket: SocketLike, username: string) => {
		if (!username || typeof username !== 'string') return;
		socket.join(username);
		socket.data = socket.data || {};
		socket.data.subscriptions = socket.data.subscriptions || new Set<string>();
		if (!socket.data.subscriptions.has(username)) {
			socket.data.subscriptions.add(username);
			ensureConnection(username);
		}
		console.log(`User '${username}' joined room.`);
	};

	const leaveRoom = (socket: SocketLike, username: string) => {
		if (!username || typeof username !== 'string') return;
		socket.leave(username);
		if (socket.data?.subscriptions?.has(username)) {
			socket.data.subscriptions.delete(username);
			releaseConnection(username);
		}
		console.log(`User '${username}' left room.`);
	};

	io.on('connection', (socket: SocketLike) => {
		console.log('Socket.IO connection established.');
		socket.on('join', (...args: unknown[]) => {
			const payload = args[0] as { username?: unknown } | undefined;
			const username = payload && typeof payload.username === 'string' ? payload.username : undefined;
			if (username) joinRoom(socket, username);
		});
		socket.on('leave', (...args: unknown[]) => {
			const payload = args[0] as { username?: unknown } | undefined;
			const username = payload && typeof payload.username === 'string' ? payload.username : undefined;
			if (username) leaveRoom(socket, username);
		});
		socket.on('disconnect', () => {
			console.log('Socket disconnected. Cleaning up subscriptions.');
			const subs: Set<string> = socket.data?.subscriptions || new Set<string>();
			subs.forEach((u: string) => releaseConnection(u));
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
export const tiktokHandler = (req: Request, res: Response) => {
	const underlying = ((req.socket as unknown) as { server?: HttpServerWithIO }).server;
	if (!underlying) {
		res.status(500).send('No underlying server available to attach socket.io');
		return;
	}

	try {
		attachIOToServer(underlying);
		res.setHeader('Retry-After', 0).status(503).send('Websockets now ready');
	} catch (err) {
		console.error('Failed to attach io', err);
		res.status(500).send('failed to initialize');
	}
};
