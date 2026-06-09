import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IKnowledgeModuleDocument } from "@sps/knowledge/models/document/sdk/model";
import QueryString from "qs";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  knowledgeModuleDocumentId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    title: string;
    description: string;
  };
}

export type IResult = IKnowledgeModuleDocument;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    knowledgeModuleDocumentId,
    params,
    options,
    host = serverHost,
    data,
  } = props;
  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify({ data }),
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/knowledge/documents/${knowledgeModuleDocumentId}?${stringifiedQuery}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
