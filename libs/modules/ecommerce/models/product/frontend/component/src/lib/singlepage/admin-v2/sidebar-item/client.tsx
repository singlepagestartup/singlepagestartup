"use client";
import "client-only";

import { Component } from "./Component";
import { IComponentProps } from "./interface";

export default function Client(props: IComponentProps) {
  return <Component {...props} />;
}
