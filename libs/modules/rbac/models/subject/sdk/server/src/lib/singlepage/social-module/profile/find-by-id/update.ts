import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel } from "@sps/social/models/profile/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
  data: {
    title?: Record<string, string>;
    subtitle?: Record<string, string>;
    description?: Record<string, string>;
    slug?: string;
  };
}
export type IResult = IModel;
export async function action(props: IProps): Promise<IResult> {
  const incoming = props.options?.headers;
  const headers = new Headers();
  if (Array.isArray(incoming)) {
    for (const [name, value] of incoming) headers.append(name, value);
  } else if (incoming && typeof incoming.forEach === "function") {
    incoming.forEach((value: string, name: string) =>
      headers.append(name, value),
    );
  } else {
    for (const [name, value] of Object.entries(incoming ?? {}))
      headers.set(name, typeof value === "string" ? value : value.join(", "));
  }
  headers.set("content-type", "application/json");
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}`,
    {
      ...props.options,
      credentials: "include",
      method: "PATCH",
      headers,
      body: JSON.stringify({ data: props.data }),
    },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
