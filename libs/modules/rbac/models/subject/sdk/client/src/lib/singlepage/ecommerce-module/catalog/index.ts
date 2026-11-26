"use client";
import {
  useMutation,
  useQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type DefaultError,
} from "@tanstack/react-query";
import { useEffect } from "react";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import {
  clientHost,
  route,
  type IStoreProductDetail,
  type IStoreCatalogDirectoryCreate,
  type IStoreCatalogDirectoryUpdate,
} from "@sps/rbac/models/subject/sdk/model";
import {
  storeProductsPath,
  storeDirectoryPath,
  type IStoreDirectoryProps,
  type IStoreDirectoryListProps,
  type IStoreProductImageUploadProps,
  type IStoreProductUpdateProps,
} from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/catalog";
import { route as productRoute } from "@sps/ecommerce/models/product/sdk/model";
import { route as attributeRoute } from "@sps/ecommerce/models/attribute/sdk/model";
import { route as offerRoute } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { route as productMediaRoute } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { route as productCategoriesRoute } from "@sps/ecommerce/relations/categories-to-products/sdk/model";
import { route as productAttributesRoute } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { route as offerAttributesRoute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/model";
import { route as fileRoute } from "@sps/file-storage/models/file/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  appendToListQueries,
  patchInListQueries,
  removeFromListQueries,
  subscription,
  consistencyQueryKey,
  invalidateRouteQueries,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";

type IOfferVariables = IServerProps["IEcommerceModuleOfferCreateProps"];
type IAttributeVariables =
  IServerProps["IEcommerceModuleCatalogAttributeSetProps"];
type IOfferResult = IServerResult["IEcommerceModuleOfferCreateResult"];
type IAttributeResult =
  IServerResult["IEcommerceModuleCatalogAttributeSetResult"];
export interface IOfferCreateProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IOfferResult, DefaultError, IOfferVariables>
  >;
}
export interface IAttributeSetProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IAttributeResult, DefaultError, IAttributeVariables>
  >;
}
type IServerContextProps = IServerProps["IEcommerceModuleCatalogContextProps"];
export interface IContextProps extends IServerContextProps {
  reactQueryOptions?: Partial<
    UseQueryOptions<IServerResult["IEcommerceModuleCatalogContextResult"]>
  >;
}

export function context(props: IContextProps) {
  const key = `${route}/${props.id}/ecommerce-module/catalogue-context`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IServerResult["IEcommerceModuleCatalogContextResult"]>({
    ...props.reactQueryOptions,
    queryKey: consistencyQueryKey(key, undefined, clientHost),
    meta: {
      topics: [
        "ecommerce.stores",
        "ecommerce.products",
        "ecommerce.stores-to-products",
        "ecommerce.offers-to-offers",
        "ecommerce.attributes",
        "ecommerce.attribute-keys",
        "ecommerce.stores-to-attributes",
        "ecommerce.products-to-attributes",
        "ecommerce.stores-to-products-to-attributes",
        "ecommerce.attribute-keys-to-attributes",
        "ecommerce.attributes-to-billing-module-currencies",
        "billing.currencies",
        "rbac.subjects-to-ecommerce-module-stores",
        "rbac.subjects-to-ecommerce-module-products",
      ],
      ...props.reactQueryOptions?.meta,
    },
    queryFn: () =>
      api.ecommerceModuleCatalogContext({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}

export function offerCreate(props: IOfferCreateProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<IOfferResult, DefaultError, IOfferVariables>({
    ...options,
    mutationKey: [`${route}/:id/ecommerce-module/offers`],
    mutationFn: (variables) =>
      api.ecommerceModuleOfferCreate({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    async onSuccess(...args) {
      const [data, variables] = args;
      appendToListQueries(queryClient, productRoute, data.product);
      appendToListQueries(queryClient, offerRoute, data.offer);
      const relationRoutes = [offerAttributesRoute, attributeRoute];
      if (variables.data.categoryIds?.length) {
        relationRoutes.push(productCategoriesRoute);
      }
      if (variables.data.product || variables.data.attributeIds?.length) {
        relationRoutes.push(productAttributesRoute);
      }
      if (variables.images?.length) {
        relationRoutes.push(productMediaRoute, fileRoute);
      }
      await Promise.all(
        relationRoutes.map((target) =>
          invalidateRouteQueries(queryClient, target),
        ),
      );
      await queryClient.invalidateQueries({
        predicate: (query) =>
          [
            `${productRoute}/count`,
            `${offerRoute}/count`,
            `${route}/${variables.id}/ecommerce-module/catalogue-context`,
            `${route}/${variables.id}/crm-module/workspace/overview`,
            `${route}/${variables.id}/crm-module/workspace/options`,
            `${route}/${variables.id}/crm-module/workspace/stores`,
          ].includes(String(query.queryKey[0])) ||
          query.queryKey[0] ===
            storeProductsRoute(variables.id, data.offer.storeId),
      });
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/ecommerce-module/offers`,
        props: { id: variables.id, data: variables.data },
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      await onSuccess?.(...args);
    },
  });
}

function storeProductsRoute(
  subjectId: string,
  storeId: string,
  productId?: string,
) {
  return `${route}/${encodeURIComponent(subjectId)}/ecommerce-module/${storeProductsPath(storeId, productId)}`;
}

const storeProductTopics = [
  "rbac.subjects-to-roles",
  "rbac.subjects-to-ecommerce-module-products",
  "rbac.subjects-to-ecommerce-module-stores",
  "ecommerce.stores",
  "ecommerce.products",
  "ecommerce.stores-to-products",
  "ecommerce.stores-to-products-to-attributes",
  "ecommerce.products-to-attributes",
  "ecommerce.stores-to-attributes",
  "ecommerce.attributes",
  "ecommerce.attribute-keys",
  "ecommerce.attribute-keys-to-attributes",
  "ecommerce.attributes-to-billing-module-currencies",
  "billing.currencies",
];

function useList(
  id: string,
  storeId: string,
  offset: number,
  limit?: number,
  search?: string,
) {
  const path = storeProductsRoute(id, storeId);
  const params = { offset, limit, search: search?.trim() || undefined };
  useEffect(() => subscription(path, queryClient), [path]);
  return useQuery({
    enabled: Boolean(id && storeId),
    queryKey: consistencyQueryKey(path, params, clientHost),
    meta: { topics: storeProductTopics },
    queryFn: ({ signal }) =>
      api.storeProducts.list({
        id,
        storeId,
        ...params,
        host: clientHost,
        options: { headers: saturateHeaders(), signal },
      }),
  });
}

function useDetail(
  id: string,
  storeId: string,
  productId: string,
  ordersOffset?: number,
) {
  const path = storeProductsRoute(id, storeId, productId);
  const params = ordersOffset === undefined ? undefined : { ordersOffset };
  useEffect(() => subscription(path, queryClient), [path]);
  return useQuery({
    enabled: Boolean(id && storeId && productId),
    queryKey: consistencyQueryKey(path, params, clientHost),
    meta: {
      topics:
        ordersOffset === undefined
          ? [
              ...storeProductTopics,
              "ecommerce.categories",
              "ecommerce.categories-to-products",
              "ecommerce.products-to-file-storage-module-files",
              "ecommerce.products-to-website-builder-module-widgets",
              "ecommerce.widgets-to-products",
              "ecommerce.widgets",
              "file-storage.files",
              "website-builder.widgets",
            ]
          : [
              ...storeProductTopics,
              "ecommerce.orders",
              "ecommerce.orders-to-products",
              "ecommerce.stores-to-orders",
              "crm.tasks",
              "crm.funnels",
              "crm.funnels-to-stages",
            ],
    },
    queryFn: ({ signal }) =>
      api.storeProducts.detail({
        id,
        storeId,
        productId,
        ordersOffset,
        host: clientHost,
        options: { headers: saturateHeaders(), signal },
      }),
  });
}

async function reconcileStoreProduct(
  result: IStoreProductDetail,
  variables: Pick<
    IStoreProductUpdateProps,
    "id" | "storeId" | "productId" | "host"
  >,
  operation = "",
) {
  const { id, storeId, productId } = variables;
  const path = storeProductsRoute(id, storeId);
  const detailPath = storeProductsRoute(id, storeId, productId);
  const detailKey = consistencyQueryKey(
    detailPath,
    undefined,
    variables.host ?? clientHost,
  );
  queryClient.setQueryData<IStoreProductDetail>(detailKey, result);
  globalActionsStore.getState().addAction({
    type: "mutation",
    name: `${detailPath}${operation}`,
    props: { id, storeId, productId },
    result: { id: result.product.id },
    timestamp: Date.now(),
    requestId: createId(),
  });
  await Promise.all(
    [
      path,
      productRoute,
      offerRoute,
      attributeRoute,
      productMediaRoute,
      productCategoriesRoute,
      productAttributesRoute,
      offerAttributesRoute,
      fileRoute,
      `${route}/${id}/ecommerce-module/catalogue-context`,
    ].map((target) => invalidateRouteQueries(queryClient, target)),
  );
}

function useUpdate() {
  return useMutation({
    mutationKey: [
      `${route}/:id/ecommerce-module/stores/:storeId/products/:productId`,
    ],
    mutationFn: (variables: IStoreProductUpdateProps) =>
      api.storeProducts.update({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    async onSuccess(result, variables) {
      if (variables.data.product || variables.data.translations) {
        patchInListQueries(
          queryClient,
          productRoute,
          variables.productId,
          result.product,
        );
      }
      if (variables.data.relation?.kind.endsWith("-attribute")) {
        const path = storeDirectoryPath(variables.storeId, "attributes");
        await invalidateRouteQueries(
          queryClient,
          `${route}/${encodeURIComponent(variables.id)}/ecommerce-module/${path}`,
        );
      }
      await reconcileStoreProduct(result, variables);
    },
  });
}

function useUploadImage() {
  return useMutation({
    mutationKey: [
      `${route}/:id/ecommerce-module/stores/:storeId/products/:productId/images`,
    ],
    mutationFn: (variables: IStoreProductImageUploadProps) =>
      api.storeProducts.uploadImage({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    onSuccess: (result, variables) =>
      reconcileStoreProduct(result, variables, "/images"),
  });
}

export const storeProducts = { useList, useDetail, useUpdate, useUploadImage };

export function attributeSet(props: IAttributeSetProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<IAttributeResult, DefaultError, IAttributeVariables>({
    ...options,
    mutationKey: [`${route}/:id/ecommerce-module/catalogue-attributes`],
    mutationFn: (variables) =>
      api.ecommerceModuleCatalogAttributeSet({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    async onSuccess(...args) {
      const [data, variables] = args;
      patchInListQueries(queryClient, attributeRoute, data.id, data);
      appendToListQueries(queryClient, attributeRoute, data);
      for (const query of queryClient
        .getQueryCache()
        .findAll({ queryKey: [`${attributeRoute}/${data.id}`] })) {
        queryClient.setQueryData(query.queryKey, (old: unknown) =>
          old && typeof old === "object" ? { ...old, ...data } : old,
        );
      }
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/ecommerce-module/catalogue-attributes`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      await onSuccess?.(...args);
    },
  });
}

export interface IMutationProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<
      IServerResult["IEcommerceModuleCatalogMutationResult"],
      DefaultError,
      IServerProps["IEcommerceModuleCatalogMutationProps"]
    >
  >;
}
export function mutation(props: IMutationProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<
    IServerResult["IEcommerceModuleCatalogMutationResult"],
    DefaultError,
    IServerProps["IEcommerceModuleCatalogMutationProps"]
  >({
    ...options,
    mutationKey: [`${route}/:id/ecommerce-module/catalogue-mutations`],
    mutationFn: (variables) =>
      api.ecommerceModuleCatalogMutation({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    async onSuccess(...args) {
      const [data, variables] = args;
      const entityRoute = variables.data.entity.startsWith("subjects-to-")
        ? `/api/rbac/${variables.data.entity}`
        : `/api/ecommerce/${variables.data.entity}`;
      if (variables.data.method === "DELETE") {
        removeFromListQueries(queryClient, entityRoute, data.id);
        queryClient.removeQueries({ queryKey: [`${entityRoute}/${data.id}`] });
      } else {
        patchInListQueries(queryClient, entityRoute, data.id, data);
        appendToListQueries(queryClient, entityRoute, data);
        for (const query of queryClient
          .getQueryCache()
          .findAll({ queryKey: [`${entityRoute}/${data.id}`] })) {
          queryClient.setQueryData(query.queryKey, (old: unknown) =>
            old && typeof old === "object" ? { ...old, ...data } : old,
          );
        }
      }
      await queryClient.invalidateQueries({
        predicate: (query) =>
          String(query.queryKey[0]).startsWith(entityRoute) ||
          ([
            "stores",
            "products",
            "stores-to-products",
            "subjects-to-ecommerce-module-stores",
          ].includes(variables.data.entity) &&
            [
              `${route}/${variables.id}/crm-module/workspace/stores`,
              `${route}/${variables.id}/crm-module/workspace/overview`,
            ].includes(String(query.queryKey[0]))) ||
          query.queryKey[0] ===
            `${route}/${variables.id}/ecommerce-module/catalogue-context`,
      });
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/ecommerce-module/catalogue-mutations`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      await onSuccess?.(...args);
    },
  });
}

async function reconcileDirectories(
  input: IStoreCatalogDirectoryCreate | IStoreCatalogDirectoryUpdate,
) {
  const kinds = new Set<string>([input.kind]);
  if (input.kind === "attributes" && "newKey" in input && input.newKey) {
    kinds.add("attribute-keys");
  }
  if (input.kind === "attribute-keys") {
    kinds.add("attributes");
  }
  const routes = [...kinds].map((kind) => `/api/ecommerce/${kind}`);
  if (input.kind === "attributes") {
    routes.push(
      "/api/ecommerce/attribute-keys-to-attributes",
      "/api/ecommerce/stores-to-attributes",
    );
  }
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const key = String(query.queryKey[0]);
      return (
        routes.some((route) => key === route || key.startsWith(route + "/")) ||
        (key.startsWith(route + "/") &&
          ([...kinds].some(
            (kind) =>
              key.includes(`/directories/${kind}/`) ||
              key.endsWith(`/directories/${kind}`),
          ) ||
            /\/ecommerce-module\/stores\/[^/]+\/products\/[^/]+$/.test(key) ||
            key.endsWith("/ecommerce-module/catalogue-context")))
      );
    },
  });
}

export const storeCatalogDirectories = {
  useDetail(
    props: IStoreDirectoryProps & { recordId: string; enabled: boolean },
  ) {
    const path = `${route}/${props.id}/ecommerce-module/${storeDirectoryPath(props.storeId, props.kind)}/${props.recordId}`;
    const host = props.host ?? clientHost;
    useEffect(
      () => (props.enabled ? subscription(path, queryClient) : undefined),
      [props.enabled, path],
    );
    return useQuery({
      enabled: props.enabled,
      queryKey: consistencyQueryKey(path, undefined, host),
      meta: {
        topics: [
          ...storeProductTopics,
          "ecommerce.categories",
          "rbac.roles-to-permissions",
          "rbac.permissions",
        ],
      },
      queryFn: ({ signal }) =>
        api.storeCatalogDirectories.detail({
          ...props,
          host,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
            signal,
          },
        }),
    });
  },
  useUpdate(props: IStoreDirectoryProps & { recordId: string }) {
    const path = `${route}/${props.id}/ecommerce-module/${storeDirectoryPath(props.storeId, props.kind)}/${props.recordId}`;
    const host = props.host ?? clientHost;
    return useMutation({
      mutationKey: [path],
      mutationFn: (data: IStoreCatalogDirectoryUpdate) =>
        api.storeCatalogDirectories.update({
          ...props,
          data,
          host,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
          },
        }),
      onError: () => invalidateRouteQueries(queryClient, path),
      async onSuccess(result, input) {
        const rawRoute = `/api/ecommerce/${input.kind}`;
        const patch =
          input.kind === "attributes"
            ? {
                slug: result.slug,
                adminTitle: result.adminTitle,
                [result.field === "number" ? "number" : "string"]: result.value,
              }
            : {
                slug: result.slug,
                adminTitle: result.adminTitle,
                title: result.title,
                ...(result.field && { field: result.field }),
              };
        patchInListQueries(queryClient, rawRoute, result.id, {
          id: result.id,
          ...patch,
          updatedAt: result.updatedAt,
        });
        queryClient.setQueryData(
          consistencyQueryKey(path, undefined, host),
          result,
        );
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: path,
          props: { id: props.id, storeId: props.storeId },
          result: { id: result.id },
          timestamp: Date.now(),
          requestId: createId(),
        });
        await reconcileDirectories(input);
      },
    });
  },
  useList({
    disabled,
    ...props
  }: IStoreDirectoryListProps & { disabled?: boolean }) {
    const path = `${route}/${encodeURIComponent(props.id)}/ecommerce-module/${storeDirectoryPath(props.storeId, props.kind)}`;
    const params = {
      offset: props.offset,
      limit: props.limit,
      search: props.search?.trim() || undefined,
    };
    const host = props.host ?? clientHost;
    useEffect(() => subscription(path, queryClient), [path]);
    return useQuery({
      enabled: Boolean(props.id && props.storeId && !disabled),
      queryKey: consistencyQueryKey(path, params, host),
      meta: { topics: [...storeProductTopics, "ecommerce.categories"] },
      queryFn: ({ signal }) =>
        api.storeCatalogDirectories.list({
          ...props,
          ...params,
          host,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
            signal,
          },
        }),
    });
  },
  useCreate(props: IStoreDirectoryProps) {
    const path = `${route}/${encodeURIComponent(props.id)}/ecommerce-module/${storeDirectoryPath(props.storeId, props.kind)}`;
    return useMutation({
      mutationKey: [path],
      mutationFn: (data: IStoreCatalogDirectoryCreate) =>
        api.storeCatalogDirectories.create({
          ...props,
          data,
          host: props.host ?? clientHost,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
          },
        }),
      async onSuccess(result, input) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: path,
          props: { id: props.id, storeId: props.storeId, kind: props.kind },
          result: { id: result.id },
          timestamp: Date.now(),
          requestId: createId(),
        });
        await reconcileDirectories(input);
      },
    });
  },
};
