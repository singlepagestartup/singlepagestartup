"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import {
  queryClient,
  queryConsistency,
  consistencyPrincipal,
} from "@sps/shared-frontend-client-api";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_WS_URL,
} from "@sps/shared-utils";

const authorization = () =>
  document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("rbac.subject.jwt="))
    ?.slice("rbac.subject.jwt=".length) || "";

export function Component() {
  const cursor = useRef("0");
  const epoch = useRef("");
  const heartbeat = useRef(0);
  const degraded = useRef(false);
  const [catchingUp, setCatchingUp] = useState(false);
  const state = queryConsistency(queryClient);
  const auth = useRef<string | null>(null);
  const receiveMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.protocol === 1) {
          heartbeat.current = Date.now();
          if (typeof data.degraded === "boolean") {
            degraded.current = data.degraded;
            setCatchingUp(data.degraded);
          }
          if (epoch.current && epoch.current !== data.epoch)
            state.receive({
              ...data,
              type: "resync",
              refs: state.snapshot().map((entry) => entry.metadata.ref),
            });
          epoch.current = data.epoch;
          state.receive(data);
          globalActionsStore.getState().addAction({
            type: "query",
            name: "consistency",
            requestId: `${data.epoch}:${data.cursor}:${data.type}`,
            timestamp: Date.now(),
            props: {},
            result: {
              type: data.type,
              cursor: data.cursor,
              refCount: data.refs?.length || 0,
              degraded: !!data.degraded,
            },
          });
          // Invalidations have been enqueued before advancing the cursor.
          cursor.current = data.cursor;
        } else if (data.slug === "revalidation") {
          globalActionsStore.getState().addAction({
            type: "query",
            name: "revalidation",
            requestId: data.payload,
            timestamp: Date.now(),
            props: {},
            result: data,
          });
        }
      } catch {
        /* Unknown legacy frames do not stop recovery. */
      }
    },
    [state],
  );
  const { sendJsonMessage, readyState, getWebSocket } = useWebSocket(
    `${NEXT_PUBLIC_API_SERVICE_WS_URL}/ws/revalidation`,
    {
      onMessage: receiveMessage,
      shouldReconnect: () => true,
      reconnectAttempts: Infinity,
      reconnectInterval: (attempt) =>
        Math.min(30000, 1000 * 2 ** Math.min(attempt, 5)) + Math.random() * 250,
    },
  );
  const send = useRef(sendJsonMessage);
  send.current = sendJsonMessage;

  useEffect(() => {
    const opened = readyState === ReadyState.OPEN;
    state.setConnected(opened);
    if (!opened) {
      const warning = setTimeout(() => setCatchingUp(true), 5000);
      return () => clearTimeout(warning);
    }
    heartbeat.current = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscribe = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(
        () =>
          send.current({
            type: "subscribe",
            refs: state
              .snapshot()
              .slice(0, 100)
              .map((entry) => entry.metadata.ref),
            cursor: cursor.current,
            epoch: epoch.current,
            authorization: authorization(),
          }),
        20,
      );
    };
    subscribe();
    const unsubscribe = state.subscribe(subscribe);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      state.setConnected(false);
    };
  }, [readyState, state]);

  useEffect(() => {
    let checking = false;
    if (auth.current === null) auth.current = authorization();
    const updateAuth = () => {
      const token = authorization();
      if (token === auth.current) return false;
      const samePrincipal =
        !!consistencyPrincipal(token) &&
        consistencyPrincipal(token) ===
          consistencyPrincipal(auth.current || "");
      auth.current = token;
      state.clear();
      cursor.current = "0";
      epoch.current = "";
      if (samePrincipal) void queryClient.invalidateQueries();
      else void queryClient.resetQueries();
      send.current({
        type: "subscribe",
        refs: [],
        cursor: "0",
        epoch: "",
        authorization: token,
      });
      return true;
    };
    const check = async () => {
      if (
        checking ||
        document.visibilityState === "hidden" ||
        !navigator.onLine
      )
        return;
      const token = authorization();
      if (updateAuth()) return;
      checking = true;
      try {
        await state.check(async (refs) => {
          const response = await fetch(
            `${NEXT_PUBLIC_API_SERVICE_URL}/api/consistency/check`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: token } : {}),
              },
              body: JSON.stringify({ refs }),
              cache: "no-store",
            },
          );
          if (!response.ok) {
            if (response.status === 401 || response.status === 403)
              state.receive({
                protocol: 1,
                type: "resync",
                epoch: "",
                cursor: "0",
                refs,
              });
            throw new Error("Consistency check failed");
          }
          const result = await response.json();
          return result.data;
        });
      } catch {
        degraded.current = true;
        setCatchingUp(true);
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(() => {
      updateAuth();
      if (
        readyState === ReadyState.OPEN &&
        Date.now() - heartbeat.current > 30000
      )
        getWebSocket()?.close();
      if (
        readyState !== ReadyState.OPEN ||
        degraded.current ||
        Date.now() - heartbeat.current > 30000
      )
        void check();
    }, 15000);
    const resume = () => void check();
    window.addEventListener("focus", resume);
    window.addEventListener("sps-rbac-auth-storage-change", updateAuth);
    window.addEventListener("storage", updateAuth);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", resume);
      window.removeEventListener("sps-rbac-auth-storage-change", updateAuth);
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [readyState, state, getWebSocket]);
  return (
    <div
      data-variant="revalidation"
      data-connection={
        readyState === ReadyState.OPEN ? "online" : "reconnecting"
      }
      role="status"
      aria-live="polite"
      className={
        catchingUp
          ? "fixed bottom-3 left-1/2 z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm"
          : "sr-only"
      }
    >
      {catchingUp
        ? readyState === ReadyState.OPEN
          ? "Updates are delayed. Checking for changes."
          : "Reconnecting. Updates may be delayed."
        : "Connected"}
    </div>
  );
}
