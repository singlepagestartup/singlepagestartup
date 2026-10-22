"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IClientComponentProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const russian = props.language === "ru";
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full border-b border-border bg-background/95 text-foreground",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3 lg:px-8">
        <div className="shrink-0">{props.logotype}</div>
        <button
          ref={toggle}
          type="button"
          aria-label={
            open
              ? russian
                ? "Закрыть меню"
                : "Close menu"
              : russian
                ? "Открыть меню"
                : "Open menu"
          }
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          {open ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
        <nav
          id={menuId}
          aria-label={russian ? "Основная навигация" : "Main navigation"}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={cn(
            "min-w-0 w-full flex-col gap-3 pb-2 lg:flex lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:pb-0",
            open ? "flex" : "hidden",
          )}
        >
          {props.content}
          {props.children}
        </nav>
      </div>
    </header>
  );
}
