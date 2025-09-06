"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cog,
  Compass,
  Home,
  Loader2,
  Pause,
  Search,
  User2,
} from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import type { User } from "next-auth";

import { useIsPlayerInit, useQueue } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { Icons } from "../icons";

type Props = {
  user?: User;
};

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Browse", icon: Compass, href: "/browse" },
  { label: "Login", icon: User2, href: "/login" },
  { label: "Settings", icon: Cog, href: "/settings" },
];

export function MobileNav({ user }: Props) {
  const pathname = usePathname();
  const filteredNavItems = mobileNavItems.filter(({ label }) =>
    user ? label !== "Login" : label !== "Settings"
  );

  const { playing, togglePlayPause, isLoading } = useGlobalAudioPlayer();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [queue] = useQueue();

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else if (queue.length > 0) {
      setIsPlayerInit(true);
    }
  }

  // Insert play/pause control as a centered item within nav (no floating, stays at bottom)
  // We'll split items so control sits in the middle visually
  const mid = Math.ceil(filteredNavItems.length / 2);
  const firstHalf = filteredNavItems.slice(0, mid);
  const secondHalf = filteredNavItems.slice(mid);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-stretch justify-between border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      {firstHalf.map(({ label, icon: Icon, href }) => {
        const isActive = href === pathname;
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center text-center text-muted-foreground duration-200",
              isActive && "text-secondary-foreground"
            )}
          >
            <Icon className="size-5" />
            <span className="mt-0.5 text-[11px] font-medium">{label}</span>
          </Link>
        );
      })}

      {/* Center control */}
      <div className="flex flex-1 items-center justify-center">
        {queue.length > 0 ?
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={playPauseHandler}
            className="flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow ring-1 ring-border transition-colors hover:bg-primary"
          >
            {isLoading ?
              <Loader2 className="size-6 animate-spin" />
            : playing ?
              <Pause className="size-6" />
            : <Icons.Play className="size-6" />}
          </button>
        : <div className="text-[11px] text-muted-foreground">No Queue</div>}
      </div>

      {secondHalf.map(({ label, icon: Icon, href }) => {
        const isActive = href === pathname;
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center text-center text-muted-foreground duration-200",
              isActive && "text-secondary-foreground"
            )}
          >
            <Icon className="size-5" />
            <span className="mt-0.5 text-[11px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
