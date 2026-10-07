"use client";
import { createContext, useContext, type ReactNode } from "react";
export interface IAIChatAccount {
  email?: string;
  balance: { free: number; purchased: number } | null;
}
const AccountContext = createContext<IAIChatAccount>({ balance: null });
export function AccountProvider({
  account,
  children,
}: {
  account: IAIChatAccount;
  children: ReactNode;
}) {
  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  );
}
export const useAIChatAccount = () => useContext(AccountContext);
