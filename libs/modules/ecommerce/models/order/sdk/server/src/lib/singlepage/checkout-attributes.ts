import { serverHost, route } from "@sps/ecommerce/models/order/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  billingModuleCurrencyId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export interface IResult {
  amount: number;
  type: "subscription" | "one-time";
  interval: "day" | "week" | "month" | "year";
}

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    billingModuleCurrencyId,
    params,
    options,
    host = serverHost,
  } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/checkout-attributes/${billingModuleCurrencyId}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
