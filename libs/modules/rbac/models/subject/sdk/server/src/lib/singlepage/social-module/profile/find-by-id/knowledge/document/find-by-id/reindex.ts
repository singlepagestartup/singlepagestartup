import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IKnowledgeIndexResponse } from "@sps/knowledge/sdk/model";
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
}

export type IResult = IKnowledgeIndexResponse["data"];

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    knowledgeModuleDocumentId,
    params,
    options,
    host = serverHost,
  } = props;
  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/knowledge/documents/${knowledgeModuleDocumentId}/reindex?${stringifiedQuery}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
