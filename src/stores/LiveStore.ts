import {atom} from "jotai";
import {SocketClient} from "./UsernameStore";
import store from "./jotaiStore";
import type {Chat} from "../models/chat";
import type {Gift} from "../models/gift";
import type {Member} from "../models/member";
import type {Like} from "@/models/like";
import {Follow} from "@/models/follow";

import * as Speech from "expo-speech";

const TAG = "[LiveStore]";

const toSpeech = async (
    author?: string,
    message?: string,
    isPriority = false
) => {
    const BASE_SPEED = 1.0;
    const VOLUME = 1.0;
    if (!author || !message) return;
    const sanitizeAuthor = author.replace(/[^a-zA-Z]/g, "").slice(0, 15);
    const sanitizeMessage = message.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 250);

    if (!sanitizeAuthor || !sanitizeMessage) return;

    const phrase = `${sanitizeAuthor} ${sanitizeMessage}`;
    const SPEED = Math.max(0.5, BASE_SPEED - sanitizeMessage.length / 200);

    if (!isPriority) {
        const isSpeaking = await Speech.isSpeakingAsync();
        if (isSpeaking) {
            console.warn(
                TAG,
                "Speech in progress, skipping non-priority message",
                phrase
            );
            return;
        }
    }

    Speech.getAvailableVoicesAsync().then((voices: Speech.Voice[]) => {
        const userLang = "es";
        const filteredVoices = voices.filter((v) =>
            v.language.startsWith(userLang)
        );
        const options: Speech.SpeechOptions = {
            rate: SPEED,
            volume: VOLUME,
            onDone: () => console.log(TAG, "Speech done: ", phrase),
        };
        if (filteredVoices.length > 0) {
            const index = author.charCodeAt(0) % filteredVoices.length;
            options.voice = filteredVoices[index].identifier;
            options.pitch = 1.0 - index * 0.1;
        }
        Speech.speak(phrase, options);
    });
};

export const chatAtom = atom<Chat[]>([]);
export const userChatAtom = atom<Record<string, Chat>>({});
export const likesAtom = atom<number>(0);
export const userLikesAtom = atom<Record<string, Like>>({});
export const giftsAtom = atom<Gift[]>([]);
export const userGiftsAtom = atom<Record<string, Gift>>({});
export const membersAtom = atom<Member[]>([]);
export const followersAtom = atom<Follow[]>([]);

export const addCommentAtom = atom(null, (get, set, chat: Chat) => {
    set(chatAtom, [...get(chatAtom), chat]);
});

const IS_SPEECH_WITHOUTH_GIFTS = true;
export const updateUserChatAtom = atom(null, (get, set, chat: Chat) => {
    // Uncomment and modify to use different voices
    const userGifts = get(userGiftsAtom);

    if (IS_SPEECH_WITHOUTH_GIFTS || userGifts[String(chat.userId)]) {
        console.log("User has gifted, using special voice");
        toSpeech(
            chat.user,
            chat.comment,
            userGifts[String(chat.userId)] !== undefined
        );
        return;
    }

    set(userChatAtom, {
        ...get(userChatAtom),
        [String(chat.userId)]: chat,
    });
});

export const incrementLikesAtom = atom(null, (get, set, likeCount: number) => {
    set(likesAtom, get(likesAtom) + likeCount);
});

export const updateUserLikesAtom = atom(null, (get, set, like: Like) => {
    set(userLikesAtom, {
        ...get(userLikesAtom),
        [String(like.userId)]: like,
    });
});

export const addGiftAtom = atom(null, (get, set, gift: Gift) => {
    set(giftsAtom, [...get(giftsAtom), gift]);
});

export const updateUserGiftsAtom = atom(null, (get, set, gift: Gift) => {
    set(userGiftsAtom, {
        ...get(userGiftsAtom),
        [String(gift.userId)]: gift,
    });
});

export const addMemberAtom = atom(null, (get, set, member: Member) => {
    set(membersAtom, [...get(membersAtom), member]);
});

// Event handlers map for extensibility
const eventHandlers: Record<
    string,
    (data: Chat | Like | Gift | Member | Follow) => void
> = {
    chat: (data: Chat) => {
        store?.set(addCommentAtom, data);
        store?.set(updateUserChatAtom, data);
        console.log(TAG, `Chat from ${data.user}: ${data.comment}`);
    },
    like: (data: Like) => {
        store?.set(incrementLikesAtom, data.likeCount || 0);
        store?.set(updateUserLikesAtom, data);
        console.log(
            TAG,
            `Like from ${data.user}: +${data.likeCount}, total: ${data.totalLikeCount}`
        );
    },
    gift: (data: Gift) => {
        if (!data.giftId || !data.userId) {
            console.warn(TAG, "Invalid gift data received", data);
            return;
        }
        // store?.set(addGiftAtom, {giftId, user, repeatCount});
        store?.set(updateUserGiftsAtom, data);
        console.log(
            TAG,
            data.userId,
            `Gift by ${data.user}: ${data.giftId} x${data.repeatCount}`
        );
    },
    member: (data: Member) => {
        store?.set(addMemberAtom, data);
        console.log(TAG, `New member joined: ${data.user}`);
    },
    follow: (data: Follow) => {
        console.log(TAG, `New follower: ${data.user}`);
    },
};

SocketClient.onTikTokEvent((data: {event: string; data: any}) => {
    const {event, data: eventData} = data;

    if (!eventData) {
        console.warn(TAG, "No event data found");
        return;
    }

    const handler = eventHandlers[event];
    if (!handler) {
        console.warn(TAG, `No handler for event: ${event}`);
        return;
    }
    handler(eventData);
});
