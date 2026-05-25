import {
  IKnowledgeGenerateResponse,
  KnowledgeGenerationModelSlug,
  route,
  serverHost,
} from "@sps/knowledge/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  query: string;
  topK?: number;
  minSimilarity?: number;
  generationModelSlug?: KnowledgeGenerationModelSlug;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IProps) {
  const res = await fetch(`${props.host || serverHost}${route}/generate`, {
    credentials: "include",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: props.query,
      topK: props.topK,
      minSimilarity: props.minSimilarity,
      generationModelSlug: props.generationModelSlug,
    }),
    ...props.options,
  });

  return responsePipe<IKnowledgeGenerateResponse>({ res });
}
