"use client";

import React from "react";
import Image from "next/image";
import { Loader2, Pause } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import {
  useCurrentSong,
  useIsPlayerInit,
  useMobileNowPlayingOpen,
} from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";
import { Icons } from "./icons";

export function MobileNowPlayingTrigger() {
  const currentSong = useCurrentSong();
  const [open, setOpen] = useMobileNowPlayingOpen();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const { playing, togglePlayPause, isLoading } = useGlobalAudioPlayer();

  if (!currentSong) return null;

  function playPauseHandler(e: React.MouseEvent) {
    e.stopPropagation();
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
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
      <div className="relative size-10 overflow-hidden rounded-md">
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
        <p className="truncate text-xs font-medium text-foreground">
          {currentSong.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {currentSong.artists?.map((a) => a.name).join(", ")}
        </p>
      </div>
      <button
        aria-label={playing ? "Pause" : "Play"}
        onClick={playPauseHandler}
        className="flex size-9 items-center justify-center rounded-full bg-foreground text-background shadow hover:bg-primary"
      >
        {isLoading ?
          <Loader2 className="size-4 animate-spin" />
        : playing ?
          <Pause className="size-4" />
        : <Icons.Play className="size-4" />}
      </button>
    </div>
  );
}
