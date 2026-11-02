import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import { type NextRequestOptions, responsePipe } from "@sps/shared-utils";

export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IResult {
  amount: string;
  currencyId: string | null;
}

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
  headers.set("Cache-Control", "no-store");
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/billing-module/balance`,
    {
      ...props.options,
      headers,
      credentials: "include",
      method: "GET",
    },
  );
  const result = await responsePipe<{ data: IResult }>({ res });
  if (!result) throw new Error("Balance response is unavailable");
  return result.data;
}
