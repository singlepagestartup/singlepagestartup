"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { useEffect, useRef, type RefObject } from "react";

interface IProps {
  subjectId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  messageId?: string;
  viewportRef: RefObject<HTMLDivElement | null>;
}

export function useMarkThreadRead({
  subjectId,
  socialModuleChatId,
  socialModuleThreadId,
  messageId,
  viewportRef,
}: IProps) {
  const lastReported = useRef<string | null>(null);
  const { mutate } = api.socialModuleChatFindByIdThreadMarkRead({
    id: subjectId,
    socialModuleChatId,
    socialModuleThreadId,
  });

  useEffect(() => {
    if (!messageId || typeof IntersectionObserver === "undefined") return;
    const viewport = viewportRef.current;
    const message = Array.from(
      viewport?.querySelectorAll<HTMLElement>("[data-chat-message-id]") ?? [],
    ).find((element) => element.dataset.chatMessageId === messageId);
    if (!message) return;

    const key = `${subjectId}/${socialModuleChatId}/${socialModuleThreadId}/${messageId}`;
    let isVisible = false;

    function markRead() {
      if (
        !messageId ||
        !isVisible ||
        !message?.isConnected ||
        document.visibilityState !== "visible" ||
        lastReported.current === key
      ) {
        return;
      }
      lastReported.current = key;
      mutate(
        {
          id: subjectId,
          socialModuleChatId,
          socialModuleThreadId,
          data: { messageId },
        },
        {
          onError: () => {
            if (lastReported.current === key) lastReported.current = null;
          },
        },
      );
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && entry.intersectionRect.height > 0;
      markRead();
    });
    observer.observe(message);
    document.addEventListener("visibilitychange", markRead);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", markRead);
    };
  }, [
    messageId,
    mutate,
    socialModuleChatId,
    socialModuleThreadId,
    subjectId,
    viewportRef,
  ]);
}
