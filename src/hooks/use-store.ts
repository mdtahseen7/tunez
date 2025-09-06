import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { ImageQuality, Queue, StreamQuality } from "@/types";

const store = createStore();

const queueAtom = atomWithStorage<Queue[]>("queue", []);

export function useQueue() {
  return useAtom(queueAtom, { store });
}

const currentSongIndexAtom = atomWithStorage("current_song_index", 0);

export function useCurrentSongIndex() {
  return useAtom(currentSongIndexAtom, { store });
}

const streamQualityAtom = atomWithStorage<StreamQuality>(
  "stream_quality",
  "excellent"
);

export function useStreamQuality() {
  return useAtom(streamQualityAtom, { store });
}

const downloadQualityAtom = atomWithStorage<StreamQuality>(
  "download_quality",
  "excellent"
);

export function useDownloadQuality() {
  return useAtom(downloadQualityAtom, { store });
}

const imageQualityAtom = atomWithStorage<ImageQuality>("image_quality", "high");

export function useImageQuality() {
  return useAtom(imageQualityAtom, { store });
}

const playerCurrentTimeAtom = atom(0);

export function usePlayerCurrentTime() {
  return useAtom(playerCurrentTimeAtom, { store });
}

const isPlayingAtom = atom(false);

export function useIsPlayerInit() {
  return useAtom(isPlayingAtom, { store });
}

const isTyping = atom(false);

export function useIsTyping() {
  return useAtom(isTyping, { store });
}

// Mobile now playing expanded overlay state
const mobileNowPlayingOpenAtom = atom(false);
export function useMobileNowPlayingOpen() {
  return useAtom(mobileNowPlayingOpenAtom, { store });
}

// Shuffle + loop playlist states (moved from player for cross-component control)
const shuffleAtom = atom(false);
export function useShuffle() {
  return useAtom(shuffleAtom, { store });
}

const loopPlaylistAtom = atom(false);
export function useLoopPlaylist() {
  return useAtom(loopPlaylistAtom, { store });
}

// Derived hook to get current song from queue and index
export function useCurrentSong() {
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();

  return queue[currentIndex] || null;
}
