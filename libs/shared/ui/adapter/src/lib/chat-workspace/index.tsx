import { cn } from "@sps/shared-frontend-client-utils";
import type { IChatWorkspaceProps } from "./interface";

/** Presentation only: project data and navigation actions remain with their owner. */
export function ChatWorkspace({
  navigation,
  navigationClassName,
  navigationId,
  siteLayout,
  children,
  className,
}: IChatWorkspaceProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 overflow-hidden rounded-2xl border border-border bg-card",
        // The site navbar, Social page padding and layout space before the footer.
        siteLayout
          ? "h-[calc(100dvh-11rem-1px)] min-h-72"
          : "h-[calc(100dvh-9rem)] min-h-[560px]",
        className,
      )}
    >
      <aside
        id={navigationId}
        className={cn(
          "hidden w-56 shrink-0 overflow-y-auto bg-default p-4 text-default-foreground lg:block",
          navigationClassName,
        )}
      >
        {navigation}
      </aside>
      {children}
    </div>
  );
}

export { ChatThreadPanel } from "./ThreadPanel";
export { ChatWorkspaceNavigation } from "./Navigation";
export { ChatListActivity } from "./ListActivity";
export type { IChatWorkspaceProps, IChatThreadPanelProps } from "./interface";
