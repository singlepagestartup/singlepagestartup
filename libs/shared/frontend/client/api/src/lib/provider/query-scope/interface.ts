import type { ReactNode } from "react";
export interface IQueryScopeProviderProps {
  /** Non-secret identity of the protected resource or slot. */
  scopeKey: string;
  children: ReactNode;
}
