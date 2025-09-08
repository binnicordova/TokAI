import {SignConfig, TikTokLiveConnection, WebcastEvent} from "tiktok-live-connector";
import {
    tiktokConnectionAtom,
    tiktokCommentsAtom,
    tiktokLikesAtom,
} from "../stores/tiktokLiveStore";
import {logger} from "@/utils/logger";
import store from "@/stores/jotaiStore";

SignConfig.apiKey = "";
SignConfig.accessToken = "";

let connection: TikTokLiveConnection | null = null;

const setupConnection = (username: string) => {
    logger.debug("Setting up TikTok live connection for username:", username);
    if (connection) {
        logger.debug("Disconnecting existing TikTok live connection");
        connection.disconnect();
        connection = null;
        store.set(tiktokConnectionAtom, null);
        store.set(tiktokCommentsAtom, []);
        store.set(tiktokLikesAtom, []);
    }
    
    connection = new TikTokLiveConnection(username);

    logger.debug("Connecting to TikTok live stream for user:", username);

    connection.connect().then(() => {
        logger.info(`Connected to TikTok live stream for user: ${username}`);
        store.set(tiktokConnectionAtom, connection);
    }).catch((err) => {
        console.error(err);
        logger.error(`Failed to connect to TikTok live stream for user: ${username}`, err);
    });

    connection.on(WebcastEvent.CHAT, (data) => {
        try {
            logger.info("New comment received:", data);
            const prevComments = store.get(tiktokCommentsAtom) || [];
            store.set(tiktokCommentsAtom, [...prevComments, data]);
        } catch (err) {
            logger.error("Error handling chat event", err);
        }
    });

    connection.on(WebcastEvent.LIKE, (data) => {
        try {
            logger.info("New like received:", data);
            const prevLikes = store.get(tiktokLikesAtom) || [];
            store.set(tiktokLikesAtom, [...prevLikes, data]);
        } catch (err) {
            logger.error("Error handling like event", err);
        }
    });
};

// To start streaming, call setupConnection(username) from your React Native component when username changes.
export {setupConnection};
