import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { type IResult as IEcommerceModuleOrderTotalResult } from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export interface IProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = {
  billingModuleCurrency: IBillingModuleCurrency;
  total: number;
  orders: (IEcommerceModuleOrder & {
    total: IEcommerceModuleOrderTotalResult["ITotalResult"];
  })[];
}[];

export async function action(props: IProps): Promise<IResult> {
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
    `${host}${route}/${id}/ecommerce-module/orders/total?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
