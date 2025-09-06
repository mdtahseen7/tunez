"use client";

import React from "react";
import Image from "next/image";
import { Loader2, Pause } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import { useCurrentSong, useIsPlayerInit } from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";
import { Icons } from "./icons";

// Lightweight mini player shown only on mobile above the bottom nav
export default function MiniMobilePlayer() {
  const currentSong = useCurrentSong();
  const { playing, togglePlayPause, isLoading } = useGlobalAudioPlayer();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();

  if (!currentSong) return null;

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-14 z-40 flex items-center gap-3 border-t bg-background/95 px-3 py-2 shadow sm:hidden">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
        <Image
          src={getImageSrc(currentSong.image, "low")}
          alt={currentSong.name}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {currentSong.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {currentSong.artists?.map((a) => a.name).join(", ")}
        </p>
      </div>
      <button
        aria-label={playing ? "Pause" : "Play"}
        onClick={playPauseHandler}
        className="rounded-full bg-foreground p-3 text-background transition-colors hover:bg-primary"
      >
        {isLoading ?
          <Loader2 className="size-5 animate-spin" />
        : playing ?
          <Pause className="size-5" />
        : <Icons.Play className="size-5" />}
      </button>
    </div>
  );
}
