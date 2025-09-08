
import { atom } from 'jotai';
import type { TikTokLiveConnection, WebcastChatMessage, WebcastLikeMessage } from 'tiktok-live-connector';

export const tiktokConnectionAtom = atom<TikTokLiveConnection | null>(null);
export const tiktokCommentsAtom = atom<WebcastChatMessage[]>([]);
export const tiktokLikesAtom = atom<WebcastLikeMessage[]>([]);
