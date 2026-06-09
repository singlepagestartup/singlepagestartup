import {
  IKnowledgeSearchResponse,
  route,
  serverHost,
} from "@sps/knowledge/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  query: string;
  topK?: number;
  minSimilarity?: number;
  documentIds?: string[];
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IProps) {
  const res = await fetch(`${props.host || serverHost}${route}/search`, {
    credentials: "include",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: props.query,
      topK: props.topK,
      minSimilarity: props.minSimilarity,
      documentIds: props.documentIds,
    }),
    ...props.options,
  });

  return responsePipe<IKnowledgeSearchResponse>({ res });
}
