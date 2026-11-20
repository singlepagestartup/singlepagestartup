import { ChatNavigationSkeleton, ChatWorkspaceSkeleton } from "@sps/ui-adapter";
import type { IComponentProps } from "./interface";

export function Skeleton({
  language,
  compact,
}: Pick<IComponentProps, "language" | "compact">) {
  return compact ? (
    <ChatNavigationSkeleton />
  ) : (
    <ChatWorkspaceSkeleton language={language} list />
  );
}
