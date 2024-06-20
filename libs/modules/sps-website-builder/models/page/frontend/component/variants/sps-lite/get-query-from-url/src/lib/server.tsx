"use server";
import "server-only";

import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentProps } from "./interface";
import { Error } from "./Error";
import { api } from "@sps/sps-website-builder/models/page/frontend/api/server";
import { Component } from "./Component";
import { headers } from "next/headers";
import QueryString from "qs";

// default is required for dynamic import
export default async function Server(props: IComponentProps) {
  const headersList = headers();
  const query = headersList.get("x-sps-website-builder-query") || "";
  const parsedQuery = QueryString.parse(query);

  if (props.children) {
    return props.children({ data: parsedQuery });
  }

  return <></>;
}
