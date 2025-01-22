import { ReactNode } from "react";

export interface ISpsComponentBase {
  isServer: boolean;
  skeleton?: ReactNode;
  className?: string;
}
