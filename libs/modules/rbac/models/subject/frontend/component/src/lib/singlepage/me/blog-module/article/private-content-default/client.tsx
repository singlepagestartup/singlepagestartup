"use client";
import "client-only";
import type { IComponentProps } from "./interface";
import { Component } from "./Component";
export default function Client(props: IComponentProps) {
  return <Component {...props} isServer={false} />;
}
