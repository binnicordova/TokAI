import {atomWithStorage} from "jotai/utils";
import {atom} from "jotai";
import {logger} from "@/utils/logger";
import {createTikTokSocketClient} from "@/services/socket";

export const UsernameAtom = atomWithStorage<string>(
    "tiktokUsername",
    "lla_app"
);

export const SocketClient = createTikTokSocketClient({
    url: process.env.EXPO_PUBLIC_SOCKET_SERVER_URL,
});

export const tiktokUsernameEffectAtom = atom(
    (get) => get(UsernameAtom),
    (_get, set, newUsername: string) => {
        set(UsernameAtom, newUsername);
        logger.debug("Username changed to:", newUsername);
        SocketClient.joinRoom(newUsername);
    }
);
