"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface IAction {
  type: string;
  name: string;
  requestId: string;
  timestamp: number;
  props: any;
  result?: any;
}

export interface ActionsStore {
  name: string;
  actions: IAction[];
}

export interface State {
  stores: {
    [key: string]: ActionsStore;
  };
}

export interface Actions {
  addAction: (action: IAction) => void;
  getActionsFromStoreByName: (
    name: string,
  ) => ActionsStore["actions"] | undefined;
  reset: () => void;
}

const STORAGE_KEY = "global-actions-store";
const MAX_ACTIONS = 10;
const MAX_SESSION_STORAGE_STORES = 50;
const MAX_SESSION_STORAGE_ACTIONS = 3;
const MAX_SESSION_STORAGE_VALUE_LENGTH = 2_000;
const MAX_SESSION_STORAGE_LENGTH = 1_000_000;

function getValueType(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  }

  return value === null ? "null" : typeof value;
}

function compactValueForSessionStorage(value: unknown) {
  if (typeof value === "undefined") {
    return undefined;
  }

  try {
    const serializedValue = JSON.stringify(value);

    if (serializedValue.length <= MAX_SESSION_STORAGE_VALUE_LENGTH) {
      return value;
    }

    return {
      __truncated: true,
      type: getValueType(value),
      length: serializedValue.length,
    };
  } catch {
    return {
      __unserializable: true,
      type: getValueType(value),
    };
  }
}

function createSessionStorageSnapshot(stores: State["stores"]) {
  const storeEntries = Object.entries(stores)
    .map(([key, store]) => {
      const lastActionTimestamp =
        store.actions[store.actions.length - 1]?.timestamp || 0;

      return {
        key,
        store,
        lastActionTimestamp,
      };
    })
    .sort((a, b) => b.lastActionTimestamp - a.lastActionTimestamp)
    .slice(0, MAX_SESSION_STORAGE_STORES);

  return Object.fromEntries(
    storeEntries.map(({ key, store }) => {
      return [
        key,
        {
          name: store.name,
          actions: store.actions
            .slice(-MAX_SESSION_STORAGE_ACTIONS)
            .map((action) => {
              const snapshotAction: IAction = {
                type: action.type,
                name: action.name,
                requestId: action.requestId,
                timestamp: action.timestamp,
                props: compactValueForSessionStorage(action.props),
              };
              const result = compactValueForSessionStorage(action.result);

              if (typeof result !== "undefined") {
                snapshotAction.result = result;
              }

              return snapshotAction;
            }),
        },
      ];
    }),
  );
}

function createMetadataOnlySessionStorageSnapshot(stores: State["stores"]) {
  const storeEntries = Object.entries(stores)
    .map(([key, store]) => {
      const lastActionTimestamp =
        store.actions[store.actions.length - 1]?.timestamp || 0;

      return {
        key,
        store,
        lastActionTimestamp,
      };
    })
    .sort((a, b) => b.lastActionTimestamp - a.lastActionTimestamp)
    .slice(0, MAX_SESSION_STORAGE_STORES);

  return Object.fromEntries(
    storeEntries.map(({ key, store }) => {
      return [
        key,
        {
          name: store.name,
          actions: store.actions
            .slice(-MAX_SESSION_STORAGE_ACTIONS)
            .map((action) => {
              return {
                type: action.type,
                name: action.name,
                requestId: action.requestId,
                timestamp: action.timestamp,
              };
            }),
        },
      ];
    }),
  );
}

const saveToSessionStorage = (stores: State["stores"]) => {
  try {
    if (typeof sessionStorage === "undefined") {
      return;
    }

    const snapshot = createSessionStorageSnapshot(stores);
    let serializedSnapshot = JSON.stringify(snapshot);

    if (serializedSnapshot.length > MAX_SESSION_STORAGE_LENGTH) {
      serializedSnapshot = JSON.stringify(
        createMetadataOnlySessionStorageSnapshot(stores),
      );
    }

    sessionStorage.setItem(STORAGE_KEY, serializedSnapshot);
  } catch {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Session storage is a debug aid only; runtime state stays in memory.
    }
  }
};

export const globalActionsStore = create<State & Actions>()(
  immer((set, get) => ({
    stores: {},
    getActionsFromStoreByName: (name: string) => {
      return get().stores[name]?.actions;
    },
    addAction: (action: IAction) => {
      set((state: State) => {
        if (!state.stores[action.name]) {
          state.stores[action.name] = {
            name: action.name,
            actions: [],
          };
        }

        state.stores[action.name].actions = [
          ...state.stores[action.name].actions.slice(-MAX_ACTIONS),
          action,
        ];
      });

      saveToSessionStorage(get().stores);
    },
    reset: () => {
      set({ stores: {} });
      sessionStorage.removeItem(STORAGE_KEY);
    },
  })),
);

export const useGlobalActionsStore = globalActionsStore;
