"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export interface IHeaderNavigationProps {
  onNavigate: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export interface IAccountHeaderProps {
  page: "register" | "login" | "settings" | "help" | "tokens" | "chat";
  balance?: { free: number; purchased: number } | null;
  projectNavigation?: (props: IHeaderNavigationProps) => ReactNode;
}
export function Component({
  page,
  balance: suppliedBalance,
  projectNavigation,
}: IAccountHeaderProps) {
  const navigationId = useId();
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const auth = page === "register" || page === "login";
  const nav = auth
    ? [
        {
          label: page === "register" ? "Sign in" : "Create account",
          href: page === "register" ? "/ai-chat/login" : "/ai-chat/register",
          icon: "user-circle" as const,
        },
      ]
    : [{ label: "Help", href: "/ai-chat/help", icon: "question" as const }];
  return (
    <header
      className={`sticky top-0 z-40 border-b border-sps-line bg-sps-white px-4 py-3 @[800px]:px-8 @[800px]:py-5 ${auth ? "" : "h-18 @[800px]:h-24"}`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-2 @[800px]:gap-5 ${auth ? "flex-wrap" : "h-full"}`}
      >
        <a
          href="/ai-chat/"
          className={`group relative isolate inline-flex shrink-0 items-center gap-3 rounded-xl ${kit.focus}`}
          aria-label="SPS AI Chat home"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 -z-10 rounded-full bg-linear-to-r from-sps-green via-sps-green/30 to-sps-grey opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-focus-visible:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <path
              d="M100 -4.37114e-06C146.634 -2.33268e-06 169.952 -1.31346e-06 184.642 14.2361C185.022 14.6041 185.396 14.9781 185.764 15.3579C200 30.0484 200 53.3656 200 100C200 146.634 200 169.952 185.764 184.642C185.396 185.022 185.022 185.396 184.642 185.764C169.952 200 146.634 200 100 200C53.3656 200 30.0484 200 15.3579 185.764C14.9781 185.396 14.6041 185.022 14.236 184.642C-2.26876e-05 169.952 -2.16684e-05 146.634 -1.96299e-05 100C-1.75915e-05 53.3656 -1.65722e-05 30.0484 14.2361 15.3579C14.6041 14.9781 14.9781 14.6041 15.3579 14.2361C30.0484 -7.42882e-06 53.3656 -6.40959e-06 100 -4.37114e-06Z"
              fill="#111111"
            />
            <rect
              x="85.7234"
              y="28.6198"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="57.1724"
              y="57.1721"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="114.276"
              y="28.6199"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="142.828"
              y="57.1721"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="28.6194"
              y="114.276"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="57.1724"
              y="85.7238"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="85.7234"
              y="85.7238"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="114.276"
              y="114.276"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="114.276"
              y="85.7239"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <path
              d="M85.7234 57.1721L57.1709 57.1721L85.7234 28.6196L85.7234 57.1721Z"
              fill="white"
            />
            <path
              d="M114.276 142.828H142.829L114.276 171.381V142.828Z"
              fill="white"
            />
            <rect
              x="85.7234"
              y="142.828"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
            <rect
              x="57.1724"
              y="142.828"
              width="28.5525"
              height="28.5525"
              fill="white"
            />
          </svg>
          <span className="text-lg font-semibold tracking-tight">
            sps{" "}
            <span className="text-sps-muted transition-colors group-hover:text-sps-graphite group-focus-visible:text-sps-graphite motion-reduce:transition-none">
              ai chat
            </span>
          </span>
          <span
            aria-hidden="true"
            className="absolute -right-3 -top-2 scale-50 text-sps-green opacity-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
          >
            <Icon name="star" className="size-4" />
          </span>
        </a>
        <nav
          aria-label={auth ? "Account access" : "Account navigation"}
          className="flex shrink-0 items-center justify-end gap-1"
          onKeyDown={(event) => {
            if (event.key === "Escape" && navigationOpen) {
              setNavigationOpen(false);
              navigationTrigger.current?.focus();
            }
          }}
        >
          <div
            id={navigationId}
            className={
              auth
                ? "flex items-center gap-1"
                : `${navigationOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-start gap-1 border-b border-sps-line bg-sps-white px-4 py-3 shadow-lg @[800px]:static @[800px]:flex @[800px]:flex-row @[800px]:items-center @[800px]:border-0 @[800px]:p-0 @[800px]:shadow-none`
            }
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setNavigationOpen(false)}
                aria-current={
                  item.href === `/ai-chat/${page}` ? "page" : undefined
                }
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${kit.focus} ${item.href === `/ai-chat/${page}` ? "bg-sps-graphite font-semibold text-white" : "text-sps-muted hover:bg-sps-grey"}`}
              >
                <Icon name={item.icon} />
                {item.label}
              </a>
            ))}
            {!auth &&
              projectNavigation?.({
                onNavigate: () => setNavigationOpen(false),
                onCloseAutoFocus: (event) => {
                  if (
                    !navigationOpen &&
                    navigationTrigger.current?.offsetParent
                  ) {
                    event.preventDefault();
                    navigationTrigger.current.focus();
                  }
                },
              })}
          </div>
          {!auth && (
            <SubjectAccount
              page={page}
              balance={suppliedBalance}
              onNavigate={() => setNavigationOpen(false)}
            />
          )}
          {!auth && (
            <button
              type="button"
              ref={navigationTrigger}
              aria-label={
                navigationOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={navigationOpen}
              aria-controls={navigationId}
              onClick={() => setNavigationOpen((open) => !open)}
              className={`inline-flex size-11 items-center justify-center rounded-xl text-sps-muted hover:bg-sps-grey @[800px]:hidden ${kit.focus}`}
            >
              <Icon name={navigationOpen ? "x" : "list"} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
