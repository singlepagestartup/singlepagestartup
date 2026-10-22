"use client";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/file-storage/models/file/sdk/server";
import { clientHost } from "@sps/file-storage/models/file/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
export type IProps = IServerProps["IContentProps"];
export type IResult = IServerResult["IContentResult"];
export function action(props: IProps): Promise<IResult> {
  return api.content({
    ...props,
    host: props.host || clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  });
}
