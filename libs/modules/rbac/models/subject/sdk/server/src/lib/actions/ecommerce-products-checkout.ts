import { host, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";

export interface IProps {
  id: string;
  productId?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: any;
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
  const { id, params, data, options } = props;
  const productId = props.productId || props.data["productId"];

  if (!productId) {
    throw new Error("productId is required");
  }

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
    `${host}${route}/${id}/ecommerce/products/${productId}/checkout?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
