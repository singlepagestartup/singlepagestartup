import { serverHost, route } from "@sps/ecommerce/models/attribute/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { type IModel as IAttributeToBillingModuleCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { type IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export interface IProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: unknown;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = (IAttributeToBillingModuleCurrency & {
  billingModuleCurrency?: IBillingModuleCurrency;
})[];

export async function action(props: IProps): Promise<IResult | undefined> {
  const { id, params, options, host = serverHost } = props;

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
    `${host}${route}/${id}/billing-module-currencies?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
