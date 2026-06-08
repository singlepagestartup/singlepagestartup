"use client";

import { scrollBottomThreshold } from "../utils";
import { useCallback, useLayoutEffect, useRef, useEffect } from "react";

interface UseMessageThreadScrollProps {
  socialModuleThreadId: string;
  timelineItemCount: number;
  timelineSignature: string;
}

export function useMessageThreadScroll(props: UseMessageThreadScrollProps) {
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const shouldKeepMessagesPinnedToBottomRef = useRef(true);
  const shouldScrollToBottomOnNextRenderRef = useRef(true);
  const shouldUseInstantScrollToBottomRef = useRef(true);
  const lastSocialModuleThreadIdRef = useRef<string | null>(null);

  const updateIsAtBottom = useCallback(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      isAtBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;

      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isAtBottom = distanceFromBottom <= scrollBottomThreshold;

    isAtBottomRef.current = isAtBottom;
    shouldKeepMessagesPinnedToBottomRef.current = isAtBottom;
  }, []);

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      let nestedFrameId: number | undefined;

      const scroll = () => {
        const viewport = messagesViewportRef.current;

        if (!viewport) {
          return;
        }

        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });

        isAtBottomRef.current = true;
        shouldKeepMessagesPinnedToBottomRef.current = true;
      };

      scroll();

      const frameId = window.requestAnimationFrame(() => {
        scroll();
        nestedFrameId = window.requestAnimationFrame(scroll);
      });

      const settleTimeoutId = window.setTimeout(scroll, 80);
      const finalTimeoutId = window.setTimeout(scroll, 240);

      return () => {
        window.cancelAnimationFrame(frameId);

        if (nestedFrameId) {
          window.cancelAnimationFrame(nestedFrameId);
        }

        window.clearTimeout(settleTimeoutId);
        window.clearTimeout(finalTimeoutId);
      };
    },
    [],
  );

  const markShouldScrollToBottom = useCallback(() => {
    shouldScrollToBottomOnNextRenderRef.current = true;
    shouldKeepMessagesPinnedToBottomRef.current = true;
  }, []);

  useLayoutEffect(() => {
    const threadChanged =
      lastSocialModuleThreadIdRef.current !== props.socialModuleThreadId;

    if (threadChanged) {
      shouldUseInstantScrollToBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;
    }

    const hasTimelineItems = props.timelineItemCount > 0;
    const shouldScrollToBottom =
      threadChanged ||
      shouldScrollToBottomOnNextRenderRef.current ||
      isAtBottomRef.current;

    lastSocialModuleThreadIdRef.current = props.socialModuleThreadId;
    shouldScrollToBottomOnNextRenderRef.current = false;

    if (shouldScrollToBottom) {
      const cleanup = scrollMessagesToBottom(
        shouldUseInstantScrollToBottomRef.current ? "auto" : "smooth",
      );

      if (hasTimelineItems) {
        shouldUseInstantScrollToBottomRef.current = false;
      }

      return cleanup;
    }

    if (hasTimelineItems) {
      shouldUseInstantScrollToBottomRef.current = false;
    }

    return undefined;
  }, [
    props.socialModuleThreadId,
    props.timelineItemCount,
    props.timelineSignature,
    scrollMessagesToBottom,
  ]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const viewport = messagesViewportRef.current;
    const content = messagesContentRef.current;

    if (!viewport && !content) {
      return undefined;
    }

    let resizeFrameId: number | undefined;
    let scrollCleanup: (() => void) | undefined;

    const keepPinnedToBottom = () => {
      if (!shouldKeepMessagesPinnedToBottomRef.current) {
        return;
      }

      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        scrollCleanup?.();
        scrollCleanup = scrollMessagesToBottom("auto");
      });
    };

    const observer = new ResizeObserver(keepPinnedToBottom);

    if (viewport) {
      observer.observe(viewport);
    }

    if (content) {
      observer.observe(content);
    }

    window.addEventListener("resize", keepPinnedToBottom);

    return () => {
      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      scrollCleanup?.();
      observer.disconnect();
      window.removeEventListener("resize", keepPinnedToBottom);
    };
  }, [
    props.socialModuleThreadId,
    props.timelineItemCount,
    scrollMessagesToBottom,
  ]);

  return {
    markShouldScrollToBottom,
    messagesContentRef,
    messagesEndRef,
    messagesViewportRef,
    updateIsAtBottom,
  };
}
