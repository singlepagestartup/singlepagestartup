import { ReactNode } from "react";
import { type WagmiProviderProps } from "wagmi";

export interface IComponentProps {
  variant: "default";
  children: ReactNode;
  config: WagmiProviderProps["config"];
}
