"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Pause, Repeat, Repeat1, Shuffle, X } from "lucide-react";
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
import { cn, formatDuration, getImageSrc } from "@/lib/utils";
import { Icons } from "./icons";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";

export default function MobileNowPlaying() {
  const [open, setOpen] = useMobileNowPlayingOpen();
  const currentSong = useCurrentSong();
  const [queue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isShuffle, setIsShuffle] = useShuffle();
  const [loopPlaylist, setLoopPlaylist] = useLoopPlaylist();

  const { playing, togglePlayPause, getPosition, isLoading, duration, seek } =
    useGlobalAudioPlayer();

  const [pos, setPos] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    console.log("Mobile overlay open state changed:", open);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (isDragging) return;

    let frame: number;
    const animate = () => {
      setPos(getPosition());
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [open, getPosition, isDragging]);

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  if (!open || !currentSong) return null;

  function close() {
    setOpen(false);
  }

  function loopHandler() {
    // Simple loop current track vs playlist toggle
    if (queue.length === 1) {
      // toggle single-track loop using react-use-audio-player loop()
      // handled externally? leaving stub – could integrate if needed
    } else {
      setLoopPlaylist(!loopPlaylist);
    }
  }

  function skipToNext() {
    console.log(
      "Skip to next clicked, current index:",
      currentIndex,
      "queue length:",
      queue.length
    );
    if (!isPlayerInit) setIsPlayerInit(true);

    // If only one song, restart it or do nothing
    if (queue.length <= 1) {
      console.log("Only one song in queue, restarting current song");
      seek(0);
      return;
    }

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
    console.log("Setting new index:", index);
    setCurrentIndex(index);
  }

  function skipToPrev() {
    console.log(
      "Skip to previous clicked, current index:",
      currentIndex,
      "queue length:",
      queue.length
    );
    if (!isPlayerInit) setIsPlayerInit(true);

    // If only one song, restart it or do nothing
    if (queue.length <= 1) {
      console.log("Only one song in queue, restarting current song");
      seek(0);
      return;
    }

    let index = currentIndex;
    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else if (currentIndex > 0) {
      index = currentIndex - 1;
    } else if (loopPlaylist) {
      index = queue.length - 1;
    } else {
      index = currentIndex;
    }
    console.log("Setting new index:", index);
    setCurrentIndex(index);
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        <button
          aria-label="Close full player"
          onClick={close}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="mx-auto mb-6 mt-2 w-full max-w-xs">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl shadow-lg">
            <Image
              src={getImageSrc(currentSong.image, "high")}
              alt={currentSong.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="mb-6 space-y-1 text-center">
          <h2 className="truncate text-lg font-semibold text-foreground">
            {currentSong.name}
          </h2>
          <div className="flex flex-wrap justify-center gap-x-1 text-sm text-muted-foreground">
            {currentSong.artists?.[0] && (
              <Link
                href={`/artist/${currentSong.artists[0].name}/${currentSong.artists[0].id}`}
                className="hover:text-foreground"
              >
                {currentSong.artists[0].name}
              </Link>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Slider
            value={[isDragging ? pos : Math.min(pos, duration || 0)]}
            max={duration || 0}
            onValueChange={([v]) => setPos(v)}
            onPointerDown={() => setIsDragging(true)}
            onValueCommit={([v]) => {
              seek(v);
              setIsDragging(false);
            }}
          >
            <SliderTrack className="h-1">
              <SliderRange />
            </SliderTrack>
            <SliderThumb className="size-4" />
          </Slider>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>
              {formatDuration(pos, pos > 3600 ? "hh:mm:ss" : "mm:ss")}
            </span>
            <span>
              {formatDuration(duration, duration > 3600 ? "hh:mm:ss" : "mm:ss")}
            </span>
          </div>
        </div>

        {/* Main Control Row with Previous, Play/Pause, Next */}
        <div className="mb-6 flex items-center justify-center gap-8">
          <button
            aria-label="Previous"
            onClick={(e) => {
              console.log("Previous button clicked");
              e.stopPropagation();
              skipToPrev();
            }}
            className="flex size-12 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.SkipBack className="size-6" />
          </button>

          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={playPauseHandler}
            className="flex size-16 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-colors hover:bg-primary"
          >
            {isLoading ?
              <Loader2 className="size-8 animate-spin" />
            : playing ?
              <Pause className="size-8" />
            : <Icons.Play className="size-8" />}
          </button>

          <button
            aria-label="Next"
            onClick={(e) => {
              console.log("Next button clicked");
              e.stopPropagation();
              skipToNext();
            }}
            className="flex size-12 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.SkipForward className="size-6" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center gap-12">
          <button
            aria-label={isShuffle ? "Shuffling" : "Shuffle"}
            onClick={() => setIsShuffle(!isShuffle)}
            className={cn(
              "transition-colors",
              !isShuffle && "text-muted-foreground"
            )}
          >
            <Shuffle className="size-6" />
          </button>
          <button
            aria-label={loopPlaylist ? "Looping" : "Loop"}
            onClick={loopHandler}
            className={cn(
              "transition-colors",
              !loopPlaylist && "text-muted-foreground"
            )}
          >
            {loopPlaylist ?
              <Repeat1 className="size-6" />
            : <Repeat className="size-6" />}
          </button>
        </div>

        {/* Queue position */}
        {queue.length > 1 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} of {queue.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
