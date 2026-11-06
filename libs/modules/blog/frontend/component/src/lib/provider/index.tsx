"use client";

import { createContext, useContext } from "react";
import type { IClientComposition, IProviderProps } from "./interface";

const Composition = createContext<IClientComposition>({});

/** Presentation composition only; SDK readers retain their existing Providers. */
export function ClientCompositionProvider(props: IProviderProps) {
  return (
    <Composition.Provider value={{ renderAuthor: props.renderAuthor }}>
      {props.children}
    </Composition.Provider>
  );
}

export function useClientComposition() {
  return useContext(Composition);
}
