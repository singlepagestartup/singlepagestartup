import {
  serverHost,
  route,
  type IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IAIChatProject[];
export async function action(props: IProps): Promise<IResult> {
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles/projects`,
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
