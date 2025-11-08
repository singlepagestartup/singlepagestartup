"use client";

import { IComponentPropsExtended } from "./interface";
import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { NEXT_PUBLIC_API_SERVICE_WS_URL } from "@sps/shared-utils";

export function Component() {
  const processedActions = new Set<string>();

  const { lastMessage } = useWebSocket(
    `${NEXT_PUBLIC_API_SERVICE_WS_URL}/ws/revalidation`,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 5000,
    },
  );

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);

        if (data.slug === "revalidation") {
          globalActionsStore.getState().addAction({
            type: "query",
            name: "revalidation",
            requestId: data.payload,
            timestamp: Date.now(),
            props: {},
            result: data,
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const mountTime = Date.now();

    const unsubscribe = globalActionsStore.subscribe((state) => {
      let shouldRefetch = false;

      Object.keys(state.stores).forEach((key) => {
        const store = state.stores[key];

        const newActions = store.actions.filter((action) => {
          const isNewAction =
            action.timestamp > mountTime &&
            !processedActions.has(action.requestId);
          const isRelevantAction = action.type === "mutation";

          return isNewAction && isRelevantAction;
        });

        newActions.forEach((action) => {
          processedActions.add(action.requestId);
        });

        if (newActions.length > 0) {
          shouldRefetch = true;
        }
      });

      if (shouldRefetch) {
        console.log("WebSocket triggered refetch");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return <div data-variant="revalidation"></div>;
}
