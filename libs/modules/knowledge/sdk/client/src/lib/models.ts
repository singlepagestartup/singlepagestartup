"use client";

import {
  clientHost,
  IKnowledgeModelsResponse,
  KnowledgeModelTask,
  route,
} from "@sps/knowledge/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  task?: KnowledgeModelTask;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IProps = {}) {
  const params = props.task ? `?task=${encodeURIComponent(props.task)}` : "";
  const headers = {
    "content-type": "application/json",
    "Cache-Control": "no-store",
    ...(props.options?.headers || {}),
  };
  const res = await fetch(
    `${props.host || clientHost}${route}/models${params}`,
    {
      credentials: "include",
      method: "GET",
      ...props.options,
      headers,
    },
  );

  return responsePipe<IKnowledgeModelsResponse>({ res });
}
