import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import {
  type NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
  data: {
    variant: "default" | "artificial-intelligence";
    title: Record<string, string | undefined>;
  };
}
export type IResult = IProfile;
export async function action(props: IProps): Promise<IResult> {
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles`,
    {
      ...props.options,
      credentials: "include",
      method: "POST",
      body: prepareFormDataToSend({ data: props.data }),
    },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
