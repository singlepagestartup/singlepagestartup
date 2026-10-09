import type { ReactNode } from "react";
export interface IAIChatLayoutProps {
  children: ReactNode;
}
export function Component({ children }: IAIChatLayoutProps) {
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.ai-chat"
      className="@container min-h-screen min-w-0 bg-sps-grey font-sps text-sps-graphite"
    >
      {children}
    </div>
  );
}
