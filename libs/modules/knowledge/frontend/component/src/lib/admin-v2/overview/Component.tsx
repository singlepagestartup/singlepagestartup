import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { IComponentProps } from "./interface";
import { Component as Search } from "./search";
import { Component as Source } from "./source/Component";
import { Component as Chunk } from "./chunk/Component";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "knowledge");
  const routePath = getAdminRoutePath(props.url);

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        {routePath === "/knowledge" ? <Search /> : null}
        {routePath === "/knowledge/source" ? <Source /> : null}
        {routePath === "/knowledge/chunk" ? <Chunk /> : null}
      </div>
    </main>
  );
}
