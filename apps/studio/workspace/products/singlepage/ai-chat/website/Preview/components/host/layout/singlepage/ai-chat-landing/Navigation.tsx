"use client";
import { createContext, useContext, type ReactNode } from "react";
interface INavigationProviderProps {
  navigate: (href: string) => void;
  children: ReactNode;
  embedded?: boolean;
}
const PreviewLayoutContext = createContext(false);
export const usePreviewLayout = () => useContext(PreviewLayoutContext);
const NavigationContext = createContext<(href: string) => void>(() => {});
export function NavigationProvider({
  navigate,
  children,
  embedded = false,
}: INavigationProviderProps) {
  return (
    <PreviewLayoutContext.Provider value={embedded}>
      <NavigationContext.Provider value={navigate}>
        {children}
      </NavigationContext.Provider>
    </PreviewLayoutContext.Provider>
  );
}
export const useNavigate = () => useContext(NavigationContext);
