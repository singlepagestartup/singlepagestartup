import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";
import {
  route,
  serverHost,
  type IOfferQuoteInput,
  type IOfferQuote,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

export interface IProps {
  data: IOfferQuoteInput;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export async function action(props: IProps): Promise<IOfferQuote> {
  const { offerId, lineId, services, ...selection } = props.data;
  const headers = new Headers(props.options?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(
    (props.host ?? serverHost) +
      route +
      "/" +
      encodeURIComponent(offerId) +
      "/quote",
    {
      ...props.options,
      method: "POST",
      headers,
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        ...selection,
        services: services?.map(({ offerId, quantity }) => ({
          offerId,
          quantity,
        })),
      }),
    },
  );
  const json = await responsePipe<{ data: IOfferQuote }>({ res: response });
  if (!json?.data) {
    throw new Error("No quote returned for this offer");
  }
  return json.data;
}
