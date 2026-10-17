import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import type { IResult as IAvatarResult } from "./update";
export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IAvatarResult;
export async function action(props: IProps): Promise<IResult> {
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/avatar`,
    { ...props.options, method: "GET", credentials: "include" },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
