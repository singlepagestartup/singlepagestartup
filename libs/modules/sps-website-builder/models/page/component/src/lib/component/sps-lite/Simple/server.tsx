"use server";
import "server-only";

import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentPropsExtended } from "./interface";
import { Error } from "./Error";
import { Component } from "./Component";
import { api } from "@sps/sps-website-builder-page-api";

// default is required for dynamic import
export default async function Server(props: IComponentPropsExtended) {
  const data = await api.server.getPage(props);

  if (!data) {
    return <></>;
  }

  return (
    <ErrorBoundary fallback={Error}>
      <Component {...props} data={data} />
    </ErrorBoundary>
  );
}