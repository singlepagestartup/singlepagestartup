"use client";

import { Button, Card } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { IComponentProps } from "./interface";

function formatLabel(value: string): string {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Component(props: IComponentProps) {
  return (
    <Card className="rounded-lg border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold capitalize">
            {formatLabel(props.modelName)}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{props.modelName}</p>
        </div>
        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {props.total}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">Route</p>
        <p className="mt-0.5 truncate font-mono text-xs text-slate-900">
          {props.modelName === "product"
            ? "/api/ecommerce/products"
            : props.modelName === "attribute"
              ? "/api/ecommerce/attributes"
              : `/api/${props.moduleId}/${props.modelName}`}
        </p>
      </div>

      <div className="mt-4">
        <Button
          asChild
          type="button"
          className="!w-full rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
        >
          <Link href={props.href}>Open model</Link>
        </Button>
      </div>
    </Card>
  );
}
