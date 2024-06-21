"use client";

import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { api } from "@sps/sps-website-builder/relations/hero-section-blocks-to-sps-file-storage-module-widgets/frontend/api/client";
import {
  createPassToGlobalActionsStoreMiddleware,
  globalActionsStore,
} from "@sps/shared-store";
import { rtkQueryErrorLogger } from "@sps/ui-adapter";

const name = `sps-website-builder/${api.rtk.reducerPath}`;
const middlewares = [api.rtk.middleware];
const passToGlobalActionsStoreMiddleware =
  createPassToGlobalActionsStoreMiddleware({ name });

const store: any = configureStore({
  devTools: {
    name,
  },
  reducer: {
    [api.rtk.reducerPath]: api.rtk.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(passToGlobalActionsStoreMiddleware.middleware)
      .concat(middlewares)
      .concat(rtkQueryErrorLogger),
});

if (typeof window !== "undefined") {
  globalActionsStore.getState().addStore({
    name,
    actions: [],
  });

  if (typeof api.subscription === "function") {
    api.subscription(store);
  }
}

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
