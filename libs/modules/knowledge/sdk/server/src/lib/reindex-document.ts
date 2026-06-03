import {
  IKnowledgeIndexResponse,
  route,
  serverHost,
} from "@sps/knowledge/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IProps) {
  const res = await fetch(
    `${props.host || serverHost}${route}/documents/${props.id}/reindex`,
    {
      credentials: "include",
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      ...props.options,
    },
  );

  return responsePipe<IKnowledgeIndexResponse>({ res });
}
