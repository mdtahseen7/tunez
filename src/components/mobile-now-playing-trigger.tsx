"use client";

import React from "react";
import Image from "next/image";
import { Loader2, SkipBack, SkipForward } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import {
  useCurrentSong,
  useCurrentSongIndex,
  useIsPlayerInit,
  useLoopPlaylist,
  useMobileNowPlayingOpen,
  useQueue,
  useShuffle,
} from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";

export function MobileNowPlayingTrigger() {
  const currentSong = useCurrentSong();
  const [, setOpen] = useMobileNowPlayingOpen();
  const [queue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isShuffle] = useShuffle();
  const [loopPlaylist] = useLoopPlaylist();
  const { isLoading } = useGlobalAudioPlayer();

  if (!currentSong) return null;

  function ensureInit() {
    if (!isPlayerInit) setIsPlayerInit(true);
  }

  function skipNext(e: React.MouseEvent) {
    e.stopPropagation();
    ensureInit();
    if (!queue.length) return;
    let index = currentIndex;
    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else if (currentIndex < queue.length - 1) {
      index = currentIndex + 1;
    } else if (loopPlaylist) {
      index = 0;
    }
    setCurrentIndex(index);
  }

  function skipPrev(e: React.MouseEvent) {
    e.stopPropagation();
    ensureInit();
    if (!queue.length) return;
    let index = currentIndex;
    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else if (currentIndex > 0) {
      index = currentIndex - 1;
    } else if (loopPlaylist) {
      index = queue.length - 1;
    }
    setCurrentIndex(index);
  }

  return (
    <div
      onClick={() => {
        console.log("Mobile trigger clicked, setting open to true");
        setOpen(true);
      }}
      className="fixed bottom-14 inset-x-0 z-50 flex items-center gap-3 bg-background/90 px-3 py-2 backdrop-blur md:hidden border-t border-border/40 cursor-pointer hover:bg-background/95"
      role="button"
      aria-label="Expand now playing"
    >
      <div className="relative size-14 overflow-hidden rounded-md">
        <Image
          src={getImageSrc(currentSong.image, "low")}
          alt={currentSong.name}
          fill
          className="object-cover"
          sizes="40px"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-snug text-foreground">
          {currentSong.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {currentSong.artists?.map((a) => a.name).join(", ")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous"
          onClick={skipPrev}
          className="flex size-8 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          disabled={
            !queue.length || (queue.length === 1 && !loopPlaylist && !isShuffle)
          }
        >
          <SkipBack className="size-4" />
        </button>
        <button
          aria-label="Next"
          onClick={skipNext}
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          disabled={
            !queue.length || (queue.length === 1 && !loopPlaylist && !isShuffle)
          }
        >
          {isLoading ?
            <Loader2 className="size-4 animate-spin" />
          : <SkipForward className="size-5" />}
        </button>
      </div>
    </div>
  );
}
