import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type {
  ICatalogCreateOfferInput,
  ICatalogCreateOfferResult,
  ICatalogSetAttributeInput,
  ICatalogContext,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";
import type { IModel as IAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import {
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

interface IOptions {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IOfferCreateProps extends IOptions {
  data: ICatalogCreateOfferInput;
}
export interface IAttributeSetProps extends IOptions {
  data: ICatalogSetAttributeInput;
}
export type IOfferCreateResult = ICatalogCreateOfferResult;
export type IAttributeSetResult = IAttribute;
export type IContextProps = IOptions;
export type IContextResult = ICatalogContext;

async function request<T>(
  props: IOptions,
  path: string,
  data: unknown,
  method = "POST",
): Promise<T> {
  const headers = new Headers(props.options?.headers);
  headers.set("Content-Type", "application/json");
  const options: NextRequestOptions = {
    credentials: "include",
    ...props.options,
    method,
    cache: "no-store",
    headers,
    body: method === "GET" ? undefined : JSON.stringify({ data }),
    next: { ...props.options?.next, revalidate: 0, cache: "no-store" },
  };
  const res = await fetch(
    `${props.host ?? serverHost}${route}/${encodeURIComponent(props.id)}/ecommerce-module/${path}`,
    options,
  );
  const json = await responsePipe<{ data: T }>({ res });
  return transformResponseItem<T>(json);
}
export function offerCreate(
  props: IOfferCreateProps,
): Promise<IOfferCreateResult> {
  return request(props, "offers", props.data);
}
export function attributeSet(
  props: IAttributeSetProps,
): Promise<IAttributeSetResult> {
  return request(props, "catalogue-attributes", props.data);
}
export function context(props: IContextProps): Promise<IContextResult> {
  return request(props, "catalogue-context", undefined, "GET");
}
