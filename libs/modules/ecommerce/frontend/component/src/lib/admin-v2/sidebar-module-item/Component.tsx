import { cn, isAdminRoute } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as Product } from "./product/Component";
import { Component as Attribute } from "./attribute/Component";
import { Component as AttributeKey } from "./attribute-key/Component";
import { Component as Category } from "./category/Component";
import { Component as Order } from "./order/Component";
import { Component as Store } from "./store/Component";
import { Component as Widget } from "./widget/Component";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "ecommerce");

  return (
    <div
      className={cn(
        "rounded-md",
        props.className,
        isCurrentModule &&
          `bg-slate-50 border ${isCurrentModule ? "border-black" : "border-slate-200"} p-1.5`,
      )}
    >
      <Button
        asChild
        type="button"
        variant="outline"
        data-module="ecommerce"
        className={cn(
          "!w-full justify-between rounded-md border px-3 py-2 text-left text-sm",
          isCurrentModule
            ? "border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
        )}
      >
        <Link href={`${ADMIN_BASE_PATH}/ecommerce`}>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="truncate">Ecommerce</span>
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
          <AttributeKey isServer={props.isServer} url={props.url} />
          <Category isServer={props.isServer} url={props.url} />
          <Order isServer={props.isServer} url={props.url} />
          <Store isServer={props.isServer} url={props.url} />
          <Widget isServer={props.isServer} url={props.url} />
        </div>
      ) : null}
    </div>
  );
}
