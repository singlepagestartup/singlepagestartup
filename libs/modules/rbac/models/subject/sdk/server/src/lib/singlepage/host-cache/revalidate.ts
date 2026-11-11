import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import { responsePipe, transformResponseItem } from "@sps/shared-utils";

export interface IProps {
  authorization?: string;
  host?: string;
}

export interface IResult {
  ok: true;
}

export async function action({
  authorization,
  host = serverHost,
}: IProps): Promise<IResult> {
  const res = await fetch(`${host}${route}/host-cache/revalidate`, {
    method: "POST",
    credentials: "omit",
    headers: authorization ? { Authorization: authorization } : undefined,
  });

  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
