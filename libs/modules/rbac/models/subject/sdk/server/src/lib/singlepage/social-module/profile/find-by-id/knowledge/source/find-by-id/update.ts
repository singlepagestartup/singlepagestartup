import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IKnowledgeModuleSource } from "@sps/knowledge/models/source/sdk/model";
import QueryString from "qs";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  knowledgeModuleSourceId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    title: string;
    content: string;
  };
}

export type IResult = IKnowledgeModuleSource;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    knowledgeModuleSourceId,
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
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/knowledge/sources/${knowledgeModuleSourceId}?${stringifiedQuery}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
