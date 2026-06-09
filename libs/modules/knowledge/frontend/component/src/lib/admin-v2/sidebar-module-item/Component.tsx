import { cn, isAdminRoute } from "@sps/shared-frontend-client-utils";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "knowledge");

  return (
    <div
      className={cn(
        "rounded-md",
        props.className,
        isCurrentModule && "border border-black bg-slate-50 p-1.5",
      )}
    >
      <Button
        asChild
        type="button"
        variant="outline"
        data-module="knowledge"
        className={cn(
          "!w-full justify-between rounded-md border px-3 py-2 text-left text-sm",
          isCurrentModule
            ? "border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
        )}
      >
        <Link href={`${ADMIN_BASE_PATH}/knowledge`}>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="truncate">Knowledge</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            {isCurrentModule ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </Link>
      </Button>

      {isCurrentModule ? (
        <div className="mt-2 space-y-1 pl-3">
          <SidebarLink
            href={`${ADMIN_BASE_PATH}/knowledge`}
            label="Search"
            active={isAdminRoute(props.url, "knowledge", null)}
          />
          <SidebarLink
            href={`${ADMIN_BASE_PATH}/knowledge/source`}
            label="Sources"
            active={isAdminRoute(props.url, "knowledge", "source")}
          />
          <SidebarLink
            href={`${ADMIN_BASE_PATH}/knowledge/document`}
            label="Documents"
            active={isAdminRoute(props.url, "knowledge", "document")}
          />
          <SidebarLink
            href={`${ADMIN_BASE_PATH}/knowledge/chunk`}
            label="Chunks"
            active={isAdminRoute(props.url, "knowledge", "chunk")}
          />
          <SidebarLink
            href={`${ADMIN_BASE_PATH}/knowledge/edit-suggestion`}
            label="Edit Suggestions"
            active={isAdminRoute(props.url, "knowledge", "edit-suggestion")}
          />
        </div>
      ) : null}
    </div>
  );
}

function SidebarLink(props: { href: string; label: string; active: boolean }) {
  return (
    <Button
      asChild
      type="button"
      variant="outline"
      className={cn(
        "!w-full justify-start rounded-md border px-3 py-2 text-left text-sm",
        props.active
          ? "border-slate-900 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-900 hover:text-white"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white",
      )}
    >
      <Link href={props.href}>
        <span className="truncate">{props.label}</span>
      </Link>
    </Button>
  );
}
