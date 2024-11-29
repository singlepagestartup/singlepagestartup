import { host, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";

export interface IActionProps {
  id: string;
  productId: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: any;
}

export interface IExtendedModel extends IModel {
  subjectsToEcommerceModuleOrders: {
    order: {
      ordersToBillingModulePaymentIntents: {
        billingModulePaymentIntent: {
          invoices: IInvoice[];
        };
      }[];
    };
  }[];
}

export async function action(props: IActionProps): Promise<IExtendedModel> {
  const { id, params, data, options } = props;
  const productId = props.productId;

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
    `${host}${route}/${id}/ecommerce/products/${productId}/cart?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IExtendedModel }>({
    res,
  });

  const transformedData = transformResponseItem<IExtendedModel>(json);

  return transformedData;
}
