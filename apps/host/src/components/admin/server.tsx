"use server";
import "server-only";

// import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentProps } from "./interface";
import { Error } from "./Error";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  return <Component {...props} />;
}
