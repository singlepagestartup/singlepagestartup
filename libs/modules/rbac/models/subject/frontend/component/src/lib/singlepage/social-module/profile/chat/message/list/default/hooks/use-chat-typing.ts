"use client";

import { useEffect, useMemo } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { CHAT_TYPING_TTL_MS } from "@sps/social/models/action/sdk/model";

interface TypingScope {
  subjectId: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
}

export function useChatTyping({
  subjectId,
  socialModuleProfileId,
  socialModuleChatId,
  socialModuleThreadId,
}: TypingScope) {
  const typing = useMemo(() => {
    let sessionId: string | undefined;
    let active = false;
    let lastPulse = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let sending = false;
    let next: boolean | undefined;

    async function publish(value: boolean) {
      next = value;
      if (sending) {
        return;
      }
      sending = true;
      try {
        while (next !== undefined) {
          const state = next;
          next = undefined;
          try {
            sessionId ??= crypto.randomUUID();
            await api.socialModuleChatFindByIdThreadTyping({
              id: subjectId,
              socialModuleProfileId,
              socialModuleChatId,
              socialModuleThreadId,
              data: { sessionId, active: state },
              options: { signal: AbortSignal.timeout(CHAT_TYPING_TTL_MS) },
            });
          } catch {
            // The indicator expires if this client cannot reach the chat.
          }
        }
      } finally {
        sending = false;
      }
    }

    function stop() {
      clearTimeout(idle);
      if (active) {
        active = false;
        void publish(false);
      }
    }

    function input(value: string) {
      if (!value.trim()) {
        stop();
        return;
      }
      const now = Date.now();
      if (!active || now - lastPulse >= CHAT_TYPING_TTL_MS / 2) {
        active = true;
        lastPulse = now;
        void publish(true);
      }
      clearTimeout(idle);
      idle = setTimeout(stop, 2500);
    }
    return { input, stop };
  }, [
    subjectId,
    socialModuleProfileId,
    socialModuleChatId,
    socialModuleThreadId,
  ]);

  useEffect(() => typing.stop, [typing]);
  return typing;
}
