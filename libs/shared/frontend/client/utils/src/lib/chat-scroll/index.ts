"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CHAT_FOLLOW_LATEST_EVENT } from "@sps/shared-utils/chat-scroll";

export interface IChatScrollProps {
  identity: string;
  revision: unknown;
  count: number;
}
interface IScrollAnchor {
  id: string;
  offset: number;
  index: number;
}

/** Keep the viewport anchored while a reader is away from the latest message. */
export function useChatScroll({ identity, revision, count }: IChatScrollProps) {
  const list = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const anchor = useRef<IScrollAnchor | null>(null);
  const previous = useRef({ identity: "", count: 0 });
  const [hasNew, setHasNew] = useState(false);
  const pane = () =>
    list.current?.closest<HTMLElement>("[data-ai-chat-messages]");
  const followLatest = useCallback(() => {
    const container = pane();
    if (!container) return;
    following.current = true;
    anchor.current = null;
    container.scrollTop = container.scrollHeight;
    setHasNew(false);
  }, []);
  const restore = useCallback(() => {
    const container = pane();
    if (!container) return;
    if (following.current) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    if (!anchor.current) return;
    const rows = Array.from(
      list.current?.querySelectorAll<HTMLElement>("article[data-id]") || [],
    );
    const row =
      rows.find((row) => row.dataset.id === anchor.current!.id) ||
      rows[Math.min(anchor.current.index, rows.length - 1)];
    if (row)
      container.scrollTop +=
        row.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        anchor.current.offset;
  }, []);
  useLayoutEffect(() => {
    if (previous.current.identity !== identity) {
      following.current = true;
      anchor.current = null;
      setHasNew(false);
    } else if (!following.current && count > previous.current.count)
      setHasNew(true);
    restore();
    previous.current = { identity, count };
  }, [identity, revision, count, restore]);
  useEffect(() => {
    const content = list.current;
    const container = pane();
    if (!content || !container) return;
    const scroll = () => {
      following.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        80;
      if (following.current) {
        anchor.current = null;
        setHasNew(false);
        return;
      }
      const rows = Array.from(
        content.querySelectorAll<HTMLElement>("article[data-id]"),
      );
      const top = container.getBoundingClientRect().top;
      const index = rows.findIndex(
        (row) => row.getBoundingClientRect().bottom > top,
      );
      const row = rows[index];
      if (row)
        anchor.current = {
          id: row.dataset.id!,
          index,
          offset: row.getBoundingClientRect().top - top,
        };
    };
    const sent = (event: Event) => {
      if ((event as CustomEvent).detail?.threadId === identity) followLatest();
    };
    container.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener(CHAT_FOLLOW_LATEST_EVENT, sent);
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(restore);
    observer?.observe(content);
    return () => {
      container.removeEventListener("scroll", scroll);
      document.removeEventListener(CHAT_FOLLOW_LATEST_EVENT, sent);
      observer?.disconnect();
    };
  }, [identity, restore, followLatest]);
  return { list, hasNew, followLatest };
}
