import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { type IResult as IEcommerceModuleOrdersToProductsResult } from "@sps/ecommerce/relations/orders-to-products/sdk/server";

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

export type IResult = (IEcommerceModuleOrdersToProducts & {
  total: IEcommerceModuleOrdersToProductsResult["ITotalResult"];
})[];

export async function action(props: IProps): Promise<IResult> {
  const { id, params, options, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    cache: "no-store",
    headers: {
      ...options?.headers,
      "Cache-Control": "no-store",
    },
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/ecommerce-module/orders/orders-to-products?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
