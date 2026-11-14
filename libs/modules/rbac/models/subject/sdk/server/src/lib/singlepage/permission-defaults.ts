import {
  route,
  serverHost,
  type IPermissionDefault,
} from "@sps/rbac/models/subject/sdk/model";
import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";

export interface IProps {
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IPermissionDefault[];

export async function action({
  host = serverHost,
  options,
}: IProps = {}): Promise<IResult> {
  const res = await fetch(`${host}${route}/permission-defaults`, {
    ...options,
    cache: "no-store",
    credentials: "omit",
  });
  const json = await responsePipe<{ data: IResult }>({ res });
  if (!Array.isArray(json?.data)) {
    throw new Error("Invalid permission defaults response");
  }
  return json.data;
}
