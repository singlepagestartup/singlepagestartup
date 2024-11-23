import { ReactNode } from "react";

export interface ISpsComponentBase {
  isServer: boolean;
  hostUrl: string;
  skeleton?: ReactNode;
}
