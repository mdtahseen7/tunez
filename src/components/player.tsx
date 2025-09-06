"use client";

import React from "react";
import Link from "next/link";
import {
  Loader2,
  MoreVertical,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import type { User } from "next-auth";
import type { MyPlaylist } from "@/lib/db/schema";

import { useEventListener } from "@/hooks/use-event-listner";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useQueue,
  useStreamQuality,
} from "@/hooks/use-store";
import {
  cn,
  formatDuration,
  getDownloadLink,
  getHref,
  getImageSrc,
} from "@/lib/utils";
import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { Queue } from "./queue";
import { TileMoreButton } from "./song-list/more-button";
import { Button, buttonVariants } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "./ui/use-toast";

type PlayerProps = {
  user?: User;
  playlists?: MyPlaylist[];
};

export function Player({ user, playlists }: PlayerProps) {
  // stores
  const [queue] = useQueue();
  const [streamQuality] = useStreamQuality();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isTyping] = useIsTyping();
  // refs
  const frameRef = React.useRef<number>(0);
  // states
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [loopPlaylist, setLoopPlaylist] = React.useState(false);
  const [pos, setPos] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  // cache last chosen volume (even if muted later)
  const lastVolumeRef = React.useRef<number>(0.75);

  // third party hooks
  const {
    load,
    playing,
    togglePlayPause,
    getPosition,
    isLoading,
    duration,
    loop,
    looping,
    mute,
    muted,
    volume,
    setVolume,
    seek,
    isReady,
  } = useGlobalAudioPlayer();

  // derived display volume state to avoid direct ref usage in render
  const [displayVolumeCache, setDisplayVolumeCache] = React.useState(0.75);

  // ---------------------------------------------------------------------------
  // Persist volume across reloads (Spotify-like)
  // ---------------------------------------------------------------------------
  const VOLUME_KEY = "tunez_volume";
  const [initialVolumeLoaded, setInitialVolumeLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined" ? localStorage.getItem(VOLUME_KEY) : null;
      if (stored) {
        const v = parseFloat(stored);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          lastVolumeRef.current = v;
          setDisplayVolumeCache(v);
          // prime underlying audio hook volume BEFORE any track load
          setVolume(v);
        }
      }
    } catch {
      /* ignore */
    }
    setInitialVolumeLoaded(true);
  }, [setVolume]);

  // keep track of last volume while not muted so UI can show it before audio becomes ready
  React.useEffect(() => {
    if (!muted) setDisplayVolumeCache(lastVolumeRef.current);
  }, [muted]);

  // Persist when changed (avoid writing when muted so unmute restores previous level)
  React.useEffect(() => {
    if (!muted) {
      try {
        localStorage.setItem(VOLUME_KEY, String(lastVolumeRef.current));
      } catch {
        /* ignore */
      }
    }
  }, [volume, muted]);

  React.useEffect(() => {
    if (queue.length > 0 && isPlayerInit) {
      const audioSrc = getDownloadLink(
        queue[currentIndex].download_url,
        streamQuality
      );

      load(audioSrc, {
        html5: true,
        // onload: play,
        autoplay: true,
        initialMute: false,
        onload: () => {
          // restore previous volume after new source loads
          if (!muted) setVolume(lastVolumeRef.current);
        },
        onend: onEndHandler,
      });
    }
  }, [queue, streamQuality, currentIndex, isPlayerInit]);

  // Ensure volume reapplied if player becomes ready later (safety)
  React.useEffect(() => {
    if (initialVolumeLoaded && isReady && !muted) {
      setVolume(lastVolumeRef.current);
    }
  }, [initialVolumeLoaded, isReady, muted, setVolume]);

  // Extra: Force-apply cached volume a few times iff the underlying audio hook keeps resetting to 0.
  // This is a pragmatic workaround for race conditions inside react-use-audio-player where setVolume
  // may not stick on the first attempt during a track change. We re-apply up to N times briefly.
  React.useEffect(() => {
    if (muted) return;

    let attempts = 0;
    const maxAttempts = 8;
    const intervalMs = 150;
    let id: ReturnType<typeof setInterval> | null = null;

    const apply = () => {
      try {
        // if volume is a number and close enough to our cached value, stop
        if (typeof volume === "number") {
          if (Math.abs(volume - lastVolumeRef.current) > 0.02) {
            setVolume(lastVolumeRef.current);
          } else {
            if (id) clearInterval(id);
          }
        } else {
          // if volume not yet ready, attempt to set it
          setVolume(lastVolumeRef.current);
        }
      } catch (e) {
        // ignore
      }

      attempts++;
      if (attempts >= maxAttempts && id) {
        clearInterval(id);
      }
    };

    // kick it immediately and then a couple more times
    apply();
    id = setInterval(apply, intervalMs);

    return () => {
      if (id) clearInterval(id);
    };
  }, [isReady, currentIndex, queue.length, muted, volume, setVolume]);

  React.useEffect(() => {
    if (isDragging) {
      return;
    }

    const animate = () => {
      setPos(getPosition());
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getPosition, isDragging]);

  function loopHandler() {
    if (!isReady) return;

    if (queue.length === 1) {
      loop(!looping);
      toast({
        description:
          looping ? "Looping disabled" : "Playing current song on repeat",
      });
    } else if (!looping && !loopPlaylist) {
      setLoopPlaylist(true);
      loop(false);
      toast({ description: "Looping playlist" });
    } else if (!looping && loopPlaylist) {
      setLoopPlaylist(false);
      loop(true);
    } else if (looping) {
      loop(false);
    }
  }

  function skipToNext() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index = currentIndex;

    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else {
      if (currentIndex < queue.length - 1) {
        index = currentIndex + 1;
      } else {
        if (loopPlaylist) {
          index = 0;
        }
      }
    }
    setCurrentIndex(index);
  }

  function skipToPrev() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index = currentIndex;

    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else {
      if (currentIndex > 0) {
        index = currentIndex - 1;
      } else {
        if (loopPlaylist) {
          index = queue.length - 1;
        } else {
          index = currentIndex;
        }
      }
    }

    setCurrentIndex(index);
  }

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  function onEndHandler() {
    let index = currentIndex;

    if (isShuffle && queue.length > 1) {
      do {
        index = Math.floor(Math.random() * queue.length);
      } while (index === currentIndex);
    } else {
      if (currentIndex < queue.length - 1) {
        if (!looping) index = currentIndex + 1;
      } else {
        if (loopPlaylist) {
          index = 0;
        }
      }
    }
    setCurrentIndex(index);
  }

  /* -----------------------------------------------------------------------------------------------
   * Keyboard shortcuts (Keybinds)
   * -----------------------------------------------------------------------------------------------*/

  useEventListener("keydown", (e) => {
    if (e.key === " ") {
      if (!isTyping) {
        e.preventDefault();
        playPauseHandler();
      }
    } else if (e.key === "n" || (e.shiftKey && e.key === "ArrowRight")) {
      skipToNext();
    } else if (e.key === "p" || (e.shiftKey && e.key === "ArrowLeft")) {
      skipToPrev();
    } else if (e.shiftKey && e.key === "ArrowUp") {
      setVolume(
        typeof volume === "number" ?
          Math.min(1, volume + 0.05)
        : lastVolumeRef.current
      );
    } else if (e.shiftKey && e.key === "ArrowDown") {
      setVolume(
        typeof volume === "number" ?
          Math.max(0, volume - 0.05)
        : lastVolumeRef.current
      );
    } else if (e.key === "l") {
      loopHandler();
    } else if (e.key === "s") {
      setIsShuffle(!isShuffle);
    }
  });

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-40 h-20 bg-background border-t-2 border-border backdrop-blur supports-[backdrop-filter]:bg-background/95 animate-in slide-in-from-bottom-full [animation-duration:500ms] lg:bottom-0",
        !(isReady || queue.length) && "hidden lg:block"
      )}
    >
      {/** Top progress bar removed as per request (integrated progress remains in center controls) */}

      <div
        className={cn(
          "flex items-center px-4 pt-3 lg:px-4",
          queue.length === 0 && "text-muted-foreground"
        )}
      >
        <div className="flex w-full items-center gap-3 lg:w-1/3">
          {queue.length > 0 && queue[currentIndex]?.image ?
            <>
              <div className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-md shadow">
                <ImageWithFallback
                  src={getImageSrc(queue[currentIndex].image, "low")}
                  alt={queue[currentIndex].name}
                  fill
                  fallback="/images/placeholder/song.jpg"
                />

                <Skeleton className="absolute inset-0 -z-10" />
              </div>

              <div className="flex min-w-0 flex-col justify-center">
                <Link
                  href={getHref(
                    queue[currentIndex].url,
                    queue[currentIndex].type === "song" ? "song" : "episode"
                  )}
                  className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary"
                >
                  {queue[currentIndex].name}
                </Link>

                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {queue[currentIndex].subtitle}
                </p>
              </div>
            </>
          : <div className="flex items-center space-x-3">
              <Skeleton className="size-14 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-44 lg:w-64" />
                <Skeleton className="h-3 w-32 lg:w-48" />
              </div>
            </div>
          }
        </div>

        <div className="hidden flex-col items-center justify-center lg:flex lg:w-1/3">
          <div className="flex items-center gap-6">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  aria-label={looping ? "Looping" : "Loop"}
                  onClick={loopHandler}
                  className={cn(
                    !looping && !loopPlaylist && "text-muted-foreground"
                  )}
                >
                  {looping ?
                    <Repeat1 strokeWidth={2} className="size-6" />
                  : <Repeat strokeWidth={2} className="size-6" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {looping ?
                  "Playing current song on repeat"
                : loopPlaylist ?
                  "Looping playlist"
                : "Loop"}
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button aria-label="Previous" onClick={skipToPrev}>
                  <Icons.SkipBack className="size-8" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Previous</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={playPauseHandler}
                  className="rounded-full bg-foreground p-2 text-background transition-colors hover:bg-primary"
                >
                  {isLoading ?
                    <Loader2 className="size-6 animate-spin" />
                  : playing ?
                    <Pause className="size-6" />
                  : <Icons.Play className="size-6" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{playing ? "Pause" : "Play"}</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button aria-label="Next" onClick={skipToNext}>
                  <Icons.SkipForward className="size-8" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Next</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  aria-label={isShuffle ? "Shuffling" : "Shuffle"}
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn(!isShuffle && "text-muted-foreground")}
                >
                  <Shuffle strokeWidth={2.2} className="size-6" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isShuffle ? "Shuffling" : "Shuffle"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-1 flex w-full items-center gap-2">
            <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(pos, pos > 3600 ? "hh:mm:ss" : "mm:ss")}
            </span>
            <Slider
              value={[pos]}
              max={duration || 0}
              onValueChange={([v]) => setPos(v)}
              onPointerDown={() => setIsDragging(true)}
              onValueCommit={([v]) => {
                seek(v);
                setIsDragging(false);
              }}
              className="flex-1"
            >
              <SliderTrack className="h-1 cursor-pointer">
                <SliderRange />
              </SliderTrack>
              <SliderThumb className="block size-3 cursor-pointer" />
            </Slider>
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(duration, duration > 3600 ? "hh:mm:ss" : "mm:ss")}
            </span>
          </div>
        </div>

        <div className="hidden w-1/3 items-center justify-end gap-4 lg:flex">
          <div className="hidden items-center gap-4 xl:flex">
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => {
                if (!isReady) return;
                const newMuted = !muted;
                mute(newMuted);
                if (!newMuted && volume === 0) {
                  setVolume(0.75); // Reset to 75% if unmuting from 0
                }
              }}
              className={cn(
                "transition-opacity hover:opacity-100",
                (!isReady || muted) && "text-muted-foreground opacity-50"
              )}
            >
              {muted || volume === 0 ?
                <VolumeX />
              : volume < 0.33 ?
                <Volume />
              : volume < 0.66 ?
                <Volume1 />
              : <Volume2 strokeWidth={2} />}
            </button>

            {(() => {
              const fallback = displayVolumeCache;
              const displayVolume =
                muted ? 0 : (
                  (isReady ?
                    typeof volume === "number" ?
                      volume
                    : fallback
                  : fallback) * 100
                );
              return (
                <Slider
                  aria-label="Volume"
                  value={[displayVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => {
                    // Allow UI moves only when ready; we still cache intent so it can be applied on load
                    const newVolume = value / 100;
                    lastVolumeRef.current = newVolume; // user intent
                    setDisplayVolumeCache(newVolume);

                    if (!isReady) {
                      // If not ready, don't call setVolume yet — the onload handler will apply lastVolumeRef
                      try {
                        localStorage.setItem(VOLUME_KEY, String(newVolume));
                      } catch {
                        /* ignore */
                      }
                      return;
                    }

                    setVolume(newVolume);
                    if (newVolume > 0 && muted) mute(false);
                    if (newVolume === 0 && !muted) mute(true);

                    try {
                      localStorage.setItem(VOLUME_KEY, String(newVolume));
                    } catch {
                      /* ignore */
                    }
                  }}
                  className={cn(
                    "w-44 transition-opacity hover:opacity-100",
                    !isReady && "opacity-50"
                  )}
                >
                  <SliderTrack className="h-1 cursor-pointer">
                    <SliderRange
                      className={cn((!isReady || muted) && "bg-accent")}
                    />
                  </SliderTrack>

                  <SliderThumb
                    aria-label="Volume slider"
                    className={cn(
                      "size-4 cursor-pointer",
                      (!isReady || muted) && "bg-accent"
                    )}
                  />
                </Slider>
              );
            })()}

            <span className="w-8 text-sm font-medium">
              {muted ?
                "0"
              : Math.round(
                  (isReady ?
                    typeof volume === "number" ?
                      volume
                    : displayVolumeCache
                  : displayVolumeCache) * 100
                )
              }
              %
            </span>
          </div>

          <div className="flex">
            <Queue />

            {queue.length > 0 ?
              <TileMoreButton
                item={queue[currentIndex]}
                showAlbum
                user={user}
                playlists={playlists}
                className={buttonVariants({
                  size: "icon",
                  variant: "ghost",
                })}
              />
            : <Button size="icon" variant="ghost">
                <MoreVertical />
              </Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
