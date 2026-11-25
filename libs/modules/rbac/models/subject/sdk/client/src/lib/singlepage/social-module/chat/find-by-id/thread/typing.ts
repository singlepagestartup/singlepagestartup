"use client";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IProps as ServerProps,
  type IResult as ServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
export type IProps = ServerProps["ISocialModuleChatFindByIdThreadTypingProps"];
export type IResult =
  ServerResult["ISocialModuleChatFindByIdThreadTypingResult"];
export function action(props: IProps): Promise<IResult> {
  return api.socialModuleChatFindByIdThreadTyping({
    ...props,
    host: clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  });
}
