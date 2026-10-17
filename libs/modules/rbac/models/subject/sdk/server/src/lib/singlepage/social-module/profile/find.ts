import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
export interface IProps {
  id: string;
  host?: string;
  params?: Record<string, any>;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IProfile[];
export async function action(props: IProps): Promise<IResult> {
  const query = QueryString.stringify(props.params, { encodeValuesOnly: true });
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles?${query}`,
    {
      ...props.options,
      credentials: "include",
      method: "GET",
    },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
