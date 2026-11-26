import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type {
  IStoreProductCreateOfferInput,
  ICatalogCreateOfferResult,
  ICatalogSetAttributeInput,
  ICatalogContext,
  ICatalogMutationInput,
  ICatalogMutationResult,
  IStoreProductList,
  IStoreProductDetail,
  IStoreProductUpdate,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";
import type {
  IStoreCatalogDirectoryPage,
  IStoreCatalogDirectoryDetail,
  IStoreCatalogDirectoryUpdate,
  IStoreCatalogDirectoryItem,
  IStoreCatalogDirectoryCreate,
  TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model";
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
  data: IStoreProductCreateOfferInput;
  images?: File[];
}
export interface IMutationProps extends IOptions {
  data: ICatalogMutationInput;
}
export type IMutationResult = ICatalogMutationResult;
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
  const multipart = data instanceof FormData;
  if (multipart) {
    headers.delete("Content-Type");
  } else {
    headers.set("Content-Type", "application/json");
  }
  const options: NextRequestOptions = {
    credentials: "include",
    ...props.options,
    method,
    cache: "no-store",
    headers,
    body:
      method === "GET"
        ? undefined
        : multipart
          ? data
          : JSON.stringify({ data }),
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
  if (props.images?.length) {
    const form = new FormData();
    form.set("data", JSON.stringify(props.data));
    for (const image of props.images) {
      form.append("images", image);
    }
    return request(props, "offers", form);
  }
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

export function mutation(props: IMutationProps): Promise<IMutationResult> {
  return request(props, "catalogue-mutations", props.data);
}

export function storeProductsPath(storeId: string, productId?: string) {
  const list = `stores/${encodeURIComponent(storeId)}/products`;
  return productId ? `${list}/${encodeURIComponent(productId)}` : list;
}

export interface IStoreProductListProps extends IOptions {
  storeId: string;
  offset: number;
  limit?: number;
  search?: string;
}

export interface IStoreProductDetailProps extends IOptions {
  storeId: string;
  productId: string;
  ordersOffset?: number;
}

export interface IStoreProductUpdateProps extends IOptions {
  storeId: string;
  productId: string;
  data: IStoreProductUpdate;
}

export interface IStoreProductImageUploadProps extends IOptions {
  storeId: string;
  productId: string;
  file: File;
}

export const storeProducts = {
  list(props: IStoreProductListProps): Promise<IStoreProductList> {
    const path = storeProductsPath(props.storeId);
    const query = new URLSearchParams({ offset: String(props.offset) });
    if (props.limit !== undefined) {
      query.set("limit", String(props.limit));
    }
    if (props.search) {
      query.set("search", props.search);
    }
    return request(props, `${path}?${query}`, undefined, "GET");
  },
  detail(props: IStoreProductDetailProps): Promise<IStoreProductDetail> {
    const path = storeProductsPath(props.storeId, props.productId);
    const query =
      props.ordersOffset === undefined
        ? ""
        : `?ordersOffset=${props.ordersOffset}`;
    return request(props, `${path}${query}`, undefined, "GET");
  },
  update(props: IStoreProductUpdateProps): Promise<IStoreProductDetail> {
    const path = storeProductsPath(props.storeId, props.productId);
    return request(props, path, props.data, "PATCH");
  },
  uploadImage(
    props: IStoreProductImageUploadProps,
  ): Promise<IStoreProductDetail> {
    const path = storeProductsPath(props.storeId, props.productId);
    const form = new FormData();
    form.set("file", props.file);
    return request(props, `${path}/images`, form);
  },
};

export interface IStoreDirectoryProps extends IOptions {
  storeId: string;
  kind: TStoreCatalogDirectoryKind;
}

export interface IStoreDirectoryListProps extends IStoreDirectoryProps {
  offset: number;
  limit?: number;
  search?: string;
}

export function storeDirectoryPath(
  storeId: string,
  kind: TStoreCatalogDirectoryKind,
) {
  return `stores/${encodeURIComponent(storeId)}/directories/${kind}`;
}

export const storeCatalogDirectories = {
  detail(
    props: IStoreDirectoryProps & { recordId: string },
  ): Promise<IStoreCatalogDirectoryDetail> {
    return request(
      props,
      `${storeDirectoryPath(props.storeId, props.kind)}/${encodeURIComponent(props.recordId)}`,
      undefined,
      "GET",
    );
  },
  update(
    props: IStoreDirectoryProps & {
      recordId: string;
      data: IStoreCatalogDirectoryUpdate;
    },
  ): Promise<IStoreCatalogDirectoryDetail> {
    return request(
      props,
      `${storeDirectoryPath(props.storeId, props.kind)}/${encodeURIComponent(props.recordId)}`,
      props.data,
      "PATCH",
    );
  },
  list(props: IStoreDirectoryListProps): Promise<IStoreCatalogDirectoryPage> {
    const query = new URLSearchParams({ offset: String(props.offset) });
    if (props.limit !== undefined) {
      query.set("limit", String(props.limit));
    }
    if (props.search) {
      query.set("search", props.search);
    }
    return request(
      props,
      `${storeDirectoryPath(props.storeId, props.kind)}?${query}`,
      undefined,
      "GET",
    );
  },
  create(
    props: IStoreDirectoryProps & { data: IStoreCatalogDirectoryCreate },
  ): Promise<IStoreCatalogDirectoryItem> {
    return request(
      props,
      storeDirectoryPath(props.storeId, props.kind),
      props.data,
    );
  },
};
