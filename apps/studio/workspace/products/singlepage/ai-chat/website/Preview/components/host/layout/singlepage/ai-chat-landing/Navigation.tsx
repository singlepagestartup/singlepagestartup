"use client";
import { createContext, useContext, type ReactNode } from "react";
interface INavigationProviderProps {
  navigate: (href: string) => void;
  children: ReactNode;
}
const NavigationContext = createContext<(href: string) => void>(() => {});
export function NavigationProvider({
  navigate,
  children,
}: INavigationProviderProps) {
  return (
    <NavigationContext.Provider value={navigate}>
      {children}
    </NavigationContext.Provider>
  );
}
export const useNavigate = () => useContext(NavigationContext);
