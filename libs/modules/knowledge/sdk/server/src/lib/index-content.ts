import {
  IKnowledgeIndexResponse,
  route,
  serverHost,
} from "@sps/knowledge/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  rootPath?: string;
  limit?: number;
  dryRun?: boolean;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IProps = {}) {
  const res = await fetch(`${props.host || serverHost}${route}/index`, {
    credentials: "include",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      rootPath: props.rootPath,
      limit: props.limit,
      dryRun: props.dryRun,
    }),
    ...props.options,
  });

  return responsePipe<IKnowledgeIndexResponse>({ res });
}
