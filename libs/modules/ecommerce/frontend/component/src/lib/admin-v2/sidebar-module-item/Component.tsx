import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IComponentProps } from "./interface";
import { Component as Product } from "./product/Component";
import { Component as Attribute } from "./attribute/Component";
import { ADMIN_BASE_PATH } from "libs/shared/utils/src/lib/envs/host";

const MODULE = {
  id: "ecommerce",
  name: "Ecommerce",
  icon: "🛍️",
};

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(`${ADMIN_BASE_PATH}/ecommerce`);

  return (
    <div
      className={cn(
        "rounded-md",
        isCurrentModule &&
          `bg-slate-50 border ${isCurrentModule ? "border-black" : "border-slate-200"} p-1.5`,
      )}
    >
      <Button
        asChild
        type="button"
        variant="outline"
        data-module-item={MODULE.id}
        className={cn(
          "!w-full justify-between rounded-md border px-3 py-2 text-left text-sm",
          isCurrentModule
            ? "border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
        )}
      >
        <Link href={`${ADMIN_BASE_PATH}/ecommerce`}>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="text-base">{MODULE.icon}</span>
            <span className="truncate">{MODULE.name}</span>
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
          <Product isServer={props.isServer} url={props.url} />
          <Attribute isServer={props.isServer} url={props.url} />
        </div>
      ) : null}
    </div>
  );
}
