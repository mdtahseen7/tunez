import { cookies } from "next/headers";
import Link from "next/link";

import type { Lang } from "@/types";

import { siteConfig } from "@/config/site";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SignedOut } from "../auth-control";
import { Icons } from "../icons";
import { SearchMenu } from "../search/search-menu";
import { TopSearch } from "../search/top-search";
import { buttonVariants } from "../ui/button";
import { UserDropdown } from "../user-dropdown";
import { LanguagePicker } from "./language-picker";

export async function Navbar() {
  const cookiesStore = await cookies(); // this will trigger dynamic rendering
  const languages = cookiesStore.get("language")?.value?.split(",") ?? [];

  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center gap-3">
        {/* Compact circular home button (instead of external logo) */}
        <Link
          href="/"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
          aria-label="Home"
        >
          <Icons.Logo className="size-5" />
        </Link>

        {/* Center pill search (Spotify-like) */}
        <div className="flex flex-1 items-center">
          <SearchMenu
            pill
            placeholder="What do you want to play?"
            topSearch={<TopSearch />}
            className="hidden md:flex"
            trailingIcon={<Icons.Logo className="size-5 opacity-70" />}
          />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 md:gap-2">
          <LanguagePicker initialLanguages={languages as Lang[]} />

          <SignedOut>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
                "hidden rounded-full px-4 font-medium shadow-sm md:inline-flex"
              )}
            >
              Sign In
            </Link>
          </SignedOut>

          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  );
}
