"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface IAction {
  type: string;
  name: string;
  requestId: string;
  timestamp: number;
  props: any;
  result: any;
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

const saveToSessionStorage = (stores: State["stores"]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  } catch (error) {
    console.error("Error saving data to sessionStorage:", error);
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
