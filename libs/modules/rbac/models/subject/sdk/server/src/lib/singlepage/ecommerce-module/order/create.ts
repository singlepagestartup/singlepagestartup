import { serverHost, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";

export interface IProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    productId: string;
    storeId?: string;
    quantity: number;
    billingModuleCurrencyId?: string;
    billingModule?: { currency: { id?: string } };
    offerId?: string;
    expectedQuoteVersion?: string;
    destination?: IEcommerceCartSelection["destination"];
    services?: IEcommerceCartSelection["services"];
  };
}

export type IResult = IModel & {
  subjectsToEcommerceModuleOrders: {
    order: {
      ordersToBillingModulePaymentIntents: {
        billingModulePaymentIntent: {
          invoices: IInvoice[];
        };
      }[];
    };
  }[];
};

export async function action(props: IProps): Promise<IResult> {
  const { id, params, data, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/ecommerce-module/orders?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
