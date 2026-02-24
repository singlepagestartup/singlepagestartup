"use client";

import { Button, Card } from "@sps/shared-ui-shadcn";
import { api, Provider } from "@sps/ecommerce/models/attribute/sdk/client";
import Link from "next/link";
import { IComponentPropsExtended } from "./interface";

function Content(props: IComponentPropsExtended) {
  const { data, isLoading } = api.find({
    params: {
      offset: 0,
      limit: 1000,
    },
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });

  return (
    <Card className="rounded-lg border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md">
      {props.header ? <div className="mb-3">{props.header}</div> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold capitalize">
            Attribute
          </h3>
          <p className="mt-1 text-sm text-slate-600">attribute</p>
        </div>
        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {isLoading ? "..." : data?.length || 0}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">Route</p>
        <p className="mt-0.5 truncate font-mono text-xs text-slate-900">
          /api/ecommerce/attributes
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

export function Component(props: IComponentPropsExtended) {
  return (
    <Provider>
      <Content {...props} />
    </Provider>
  );
}
