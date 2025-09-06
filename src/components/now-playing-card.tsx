"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, MoreHorizontal, Pause, X } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import { Button } from "@/components/ui/button";
import { useCurrentSong, useIsPlayerInit } from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";
import { Icons } from "./icons";

export default function NowPlayingCard() {
  const currentSong = useCurrentSong();
  const { togglePlayPause, playing, isLoading } = useGlobalAudioPlayer();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isVisible, setIsVisible] = useState(false);

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  if (!currentSong) {
    return (
      <aside className="fixed right-0 top-14 hidden h-full w-96 border-l xl:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
            <h3 className="font-heading text-lg text-white">Now Playing</h3>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 py-6">
            <p className="text-muted-foreground text-center">
              No song currently playing
            </p>
          </div>
        </div>
      </aside>
    );
  }

  let imageUrl = getImageSrc(currentSong.image, "high");
  if (!imageUrl || imageUrl === "" || imageUrl === undefined) {
    imageUrl = "/images/placeholder/album.jpg";
  }

  return (
    <>
      {/* Desktop Now Playing Card */}
      <aside className="fixed right-0 top-14 hidden h-full w-96 border-l xl:block">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
            <h3 className="font-heading text-lg text-white truncate">
              {currentSong.album || currentSong.name}
            </h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 flex-shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Album Art - Increased size */}
              <div className="relative">
                <Image
                  src={imageUrl}
                  alt={currentSong.name}
                  width={350}
                  height={350}
                  className="w-full aspect-square object-cover rounded-xl shadow-lg"
                  unoptimized
                  onError={(e) => {
                    // fallback if image fails to load
                    e.currentTarget.src = "/images/placeholder/album.jpg";
                  }}
                />
              </div>

              {/* Song Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-xl truncate">
                  {currentSong.name}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {currentSong.artists?.map((artist, index) => (
                    <React.Fragment key={artist.id}>
                      <Link
                        href={`/artist/${artist.name}/${artist.id}`}
                        className="text-base text-muted-foreground hover:text-white transition-colors"
                      >
                        {artist.name}
                      </Link>
                      {index < (currentSong.artists?.length || 0) - 1 && (
                        <span className="text-muted-foreground text-base">
                          ,{" "}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Play/Pause Controls for Mobile */}
                <div className="flex justify-center xl:hidden">
                  <button
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={playPauseHandler}
                    className="rounded-full bg-foreground p-3 text-background transition-colors hover:bg-primary"
                  >
                    {isLoading ?
                      <Loader2 className="size-6 animate-spin" />
                    : playing ?
                      <Pause className="size-6" />
                    : <Icons.Play className="size-6" />}
                  </button>
                </div>
              </div>

              {/* Credits Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-lg">Credits</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Show all
                  </Button>
                </div>
                <div className="space-y-4">
                  {currentSong.artists?.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/artist/${artist.name}/${artist.id}`}
                          className="text-base font-semibold text-white hover:underline block truncate"
                        >
                          {artist.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {artist.role || "Singer"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-4 flex-shrink-0 ml-3"
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
