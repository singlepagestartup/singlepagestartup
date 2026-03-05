import {
  IModel as IEcommerceModuleProduct,
  serverHost,
  route,
} from "@sps/ecommerce/models/product/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IEcommerceModuleProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel as IEcommerceModuleAttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IEcommerceModuleProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";

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

type IExtendedEcommerceModuleAttribute = IEcommerceModuleAttribute & {
  attributeKeysToAttribute?: (IEcommerceModuleAttributeKeysToAttributes & {
    attributeKey?: IEcommerceModuleAttributeKey;
  })[];
  attributesToBillingModuleCurrencies?: (IEcommerceModuleAttributesToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
};

export type IResult = IEcommerceModuleProduct & {
  productsToAttributes?: (IEcommerceModuleProductsToAttributes & {
    attribute: IExtendedEcommerceModuleAttribute;
  })[];
  productsToFileStorageModuleFiles?: (IEcommerceModuleProductsToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
};

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
    `${host}${route}/${id}/extended?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
