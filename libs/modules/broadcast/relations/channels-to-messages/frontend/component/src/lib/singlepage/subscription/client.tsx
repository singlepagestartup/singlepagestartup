"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/broadcast/relations/channels-to-messages/sdk/client";
import { useEffect } from "react";
import { globalActionsStore } from "@sps/shared-frontend-client-store";

export default function Client(props: IComponentProps) {
  const processedActions = new Set<string>();

  const { data, isFetching, isLoading, refetch } = api.find(props.apiProps);

  useEffect(() => {
    if (props.set && typeof props.set === "function") {
      props.set(data);
    }
  }, [data, props]);

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
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isFetching || isLoading) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
