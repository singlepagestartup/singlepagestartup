"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { IChatWorkspaceNavigationProps } from "./interface";

export function ChatWorkspaceNavigation({
  label,
  title,
  heading: Heading = "h2",
  leading,
  actions,
  search,
  children,
  footer,
}: IChatWorkspaceNavigationProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    search.onChange("");
    setSearchOpen(false);
    searchButton.current?.focus();
  }

  return (
    <nav
      aria-label={label}
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
    >
      <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 border-b border-border px-3">
        {leading}
        <Heading
          className="min-w-0 flex-1 truncate text-base font-semibold"
          title={title}
        >
          {title}
        </Heading>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            ref={searchButton}
            type="button"
            aria-label={search.label}
            title={search.label}
            aria-expanded={searchOpen}
            aria-controls={searchOpen ? searchId : undefined}
            onClick={() => {
              if (searchOpen) closeSearch();
              else setSearchOpen(true);
            }}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
          {actions}
        </div>
      </header>
      {searchOpen && (
        <div className="min-w-0 shrink-0 border-b border-border px-3 py-2">
          <input
            id={searchId}
            ref={searchInput}
            type="search"
            aria-label={search.label}
            placeholder={search.label}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeSearch();
              }
            }}
            className="h-9 w-full min-w-0 rounded-lg border border-border bg-muted/60 px-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2">
        {children}
      </div>
      {footer}
    </nav>
  );
}
