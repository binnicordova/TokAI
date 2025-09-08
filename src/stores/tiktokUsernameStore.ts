import {atomWithStorage} from "jotai/utils";
import {atom} from "jotai";
import {setupConnection} from "@/services/tiktokLiveService";
import { logger } from "@/utils/logger";

export const tiktokUsernameAtom = atomWithStorage<string>(
    "tiktokUsername",
    "llaapp"
);

export const tiktokUsernameEffectAtom = atom(
    (get) => get(tiktokUsernameAtom),
    (get, set, newUsername: string) => {
        set(tiktokUsernameAtom, newUsername);
        logger.debug("Username changed to:", newUsername);
        setupConnection(newUsername);
    }
);
