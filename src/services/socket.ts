import {logger} from "@/utils/logger";
import {io, Socket} from "socket.io-client";

const TAG = "[TikTokSocket]";

export interface TikTokSocketOptions {
    url: string;
    autoConnect?: boolean;
}

export function createTikTokSocketClient(options: TikTokSocketOptions) {
    const socket: Socket = io(options.url, {
        autoConnect: options.autoConnect ?? true,
        transports: ["websocket"],
    });
    let joinedUsername: string | null = null;

    socket.on("connect", () => {
        logger.debug(TAG, "[TikTokSocket] Connected to server:", options.url);
        if (joinedUsername) {
            logger.debug(
                TAG,
                `[TikTokSocket] Re-joining room for username: ${joinedUsername}`
            );
            joinRoom(joinedUsername);
        }
    });

    socket.on("disconnect", (reason: string) => {
        logger.debug(TAG, "[TikTokSocket] Disconnected from server:", reason);
    });

    socket.on("connect_error", (error: Error) => {
        logger.debug(TAG, "[TikTokSocket] Connection failed:", error.message);
    });

    function joinRoom(username: string) {
        if (username) {
            socket.emit("join", {username});
            joinedUsername = username;
            logger.debug(
                TAG,
                `[TikTokSocket] Emitted join for username: ${username}`
            );
        }
    }

    function leaveRoom(username?: string) {
        const user = username || joinedUsername;
        if (user) {
            socket.emit("leave", {username: user});
            if (joinedUsername === user) joinedUsername = null;
            logger.debug(
                TAG,
                `[TikTokSocket] Emitted leave for username: ${user}`
            );
        }
    }

    function onTikTokEvent(handler: (data: any) => void) {
        socket.on("tiktok:event", (data) => {
            handler(data);
        });
    }

    function onTikTokError(handler: (data: any) => void) {
        socket.on("tiktok:error", (data) => {
            logger.debug(TAG, "[TikTokSocket] Received tiktok:error:", data);
            handler(data);
        });
    }

    function off(event: string, handler: (...args: unknown[]) => void) {
        logger.debug(
            TAG,
            `[TikTokSocket] Removing handler for event: ${event}`
        );
        socket.off(event, handler);
    }

    function disconnect() {
        logger.debug(TAG, "[TikTokSocket] Disconnecting socket");
        socket.disconnect();
    }

    return {
        joinRoom,
        leaveRoom,
        onTikTokEvent,
        onTikTokError,
        off,
        disconnect,
    };
}
