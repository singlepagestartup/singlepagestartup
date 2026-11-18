import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";
import {
  route,
  serverHost,
  type IAddressSuggestionsInput,
  type IAddressSuggestionsResult,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

export interface IProps {
  data: IAddressSuggestionsInput;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function action(
  props: IProps,
): Promise<IAddressSuggestionsResult> {
  const headers = new Headers(props.options?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(
    (props.host ?? serverHost) +
      route +
      "/" +
      encodeURIComponent(props.data.offerId) +
      "/address-suggestions",
    {
      ...props.options,
      method: "POST",
      headers,
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        query: props.data.query,
        language: props.data.language,
      }),
    },
  );
  const json = await responsePipe<{ data: IAddressSuggestionsResult }>({
    res: response,
  });
  if (
    !Array.isArray(json?.data?.suggestions) ||
    json.data.suggestions.some((value) => typeof value !== "string")
  ) {
    throw new Error("Invalid address suggestions response");
  }
  return json.data;
}
