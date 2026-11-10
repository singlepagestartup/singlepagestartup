import {
  serverHost,
  route,
  type IDeliveryCommand,
  type IDeliveryResult,
} from "@sps/broadcast/models/channel/sdk/model";
import { responsePipe } from "@sps/shared-utils";

export interface IProps<T extends IDeliveryCommand> {
  host?: string;
  data: T;
  options: { headers: Record<string, string> };
}

export async function action<T extends IDeliveryCommand>(
  props: IProps<T>,
): Promise<IDeliveryResult<T>> {
  const headers = new Headers(props.options.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${props.host ?? serverHost}${route}/delivery`, {
    method: "POST",
    headers,
    body: JSON.stringify(props.data),
    redirect: "error",
  });
  const json = await responsePipe<{ data: IDeliveryResult<T> }>({
    res: response,
    catchErrors: false,
  });
  if (!json) {
    throw new Error("Broadcast delivery returned an empty response");
  }
  return json.data;
}
