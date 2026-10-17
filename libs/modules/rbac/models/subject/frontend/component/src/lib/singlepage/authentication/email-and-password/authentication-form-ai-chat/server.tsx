"use server";
import "server-only";
import { Component } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  return <Component {...props} />;
}
