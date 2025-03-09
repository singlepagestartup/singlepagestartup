"use server";
import "server-only";

import React from "react";
import { IComponentProps } from "./interface";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  return <Component {...props} />;
}
