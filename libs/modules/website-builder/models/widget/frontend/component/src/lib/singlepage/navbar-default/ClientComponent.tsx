"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IClientComponentProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const russian = props.language === "ru";
  useEffect(() => {
    if (!open) return;
    navigation.current
      ?.querySelector<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex='0']",
      )
      ?.focus();
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
        "sticky top-0 z-50 w-full shrink-0 border-b border-border bg-card/95 font-default text-foreground backdrop-blur-sm",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto grid min-h-20 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-6 lg:px-8">
        <div className="min-w-0 py-4">{props.logotype}</div>
        <nav
          ref={navigation}
          id={menuId}
          aria-label={russian ? "Основная навигация" : "Main navigation"}
          onClick={(event) => {
            if ((event.target as Element).closest("a")) setOpen(false);
          }}
          className={cn(
            "col-span-2 row-start-2 min-w-0 w-full border-t border-border py-3 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex lg:border-t-0 lg:py-0",
            open ? "flex" : "hidden",
          )}
        >
          {props.content}
        </nav>
        <div className="col-start-2 row-start-1 flex min-h-20 shrink-0 items-center justify-end gap-2 lg:col-start-3">
          {props.children}
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
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:hidden"
          >
            {open ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
