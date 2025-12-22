import {
  serverHost,
  route,
  IModel,
} from "@sps/billing/models/payment-intent/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

interface IAttributeKey {
  id: string;
  variant: string;
  type: string;
  field: string;
  adminTitle: string;
  slug: string;
  title: {
    [key: string]: string | undefined;
  } | null;
  prefix: {
    [key: string]: string | undefined;
  } | null;
  suffix: {
    [key: string]: string | undefined;
  } | null;
  [key: string]: unknown;
}

interface IAttributesKeysToAttributes {
  id: string;
  variant: string;
  attributeKeyId: string;
  attributeId: string;
  attributeKey?: IAttributeKey;
  [key: string]: unknown;
}

interface IAttribute {
  id: string;
  variant: string;
  number?: string | null;
  boolean?: boolean | null;
  date?: Date | null;
  datetime?: Date | null;
  string?: {
    [key: string]: string | undefined;
  } | null;
  attributesKeysToAttributes: IAttributesKeysToAttributes[];
  [key: string]: unknown;
}

interface IProductsToAttributes {
  id: string;
  variant: string;
  orderIndex: number;
  productId: string;
  attributeId: string;
  attributes: IAttribute[];
  [key: string]: unknown;
}

interface IProduct {
  id: string;
  variant: string;
  type: string;
  slug: string;
  title: {
    [key: string]: string | undefined;
  } | null;
  adminTitle: string;
  productsToAttributes: IProductsToAttributes[];
  [key: string]: unknown;
}

interface IOrdersToProducts {
  id: string;
  variant: string;
  orderIndex: number;
  quantity: number;
  orderId: string;
  productId: string;
  products: IProduct[];
  [key: string]: unknown;
}

interface IOrder {
  id: string;
  ordersToProducts: IOrdersToProducts[];
}

interface IEcommerceModule {
  orders: IOrder[];
}

type IMetadata =
  | {
      ecommerceModule: IEcommerceModule;
      email: string;
    }
  | {
      ecommerceModule: IEcommerceModule;
      account: string;
    };

export interface IProps {
  host?: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  id: string;
  params?: Record<string, unknown>;
  options?: Partial<NextRequestOptions>;
  data: {
    [key: string]: unknown;
    provider: string;
    currencyId: string;
    metadata?: IMetadata;
  };
}

export interface IResult extends IModel {}

export async function action(props: IProps): Promise<IResult | undefined> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { data, params, options, id, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const formData = prepareFormDataToSend({ data });

  const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-store" }
    : {};

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    method: "POST",
    body: formData,
    headers: {
      ...cacheControlOptions,
      ...options?.headers,
    },
    next: {
      tags: [route],
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/${data.provider}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
    catchErrors: props.catchErrors || productionBuild,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
