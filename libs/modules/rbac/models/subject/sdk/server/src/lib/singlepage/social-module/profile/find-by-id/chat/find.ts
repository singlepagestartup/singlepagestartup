import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  consistencyRequestOptions,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import type {
  IModel as ISocialModuleProfile,
  IProfilePresentation,
} from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    includeSubjectProfiles?: boolean;
    includeParticipants?: boolean;
    [key: string]: unknown;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = (ISocialModuleChat & {
  participants?: ISocialModuleProfile[];
  participantPresentations?: IProfilePresentation[];
})[];

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    params,
    options,
    host = serverHost,
  } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats?${stringifiedQuery}`,
    await consistencyRequestOptions(
      `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats?${stringifiedQuery}`,
      requestOptions,
    ),
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
