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
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { route as productRoute } from "@sps/ecommerce/models/product/sdk/model";
import { route as attributeRoute } from "@sps/ecommerce/models/attribute/sdk/model";
import { route as offerRoute } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  appendToListQueries,
  patchInListQueries,
  subscription,
  consistencyQueryKey,
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
        "billing.currencies",
        "rbac.subjects-to-ecommerce-module-stores",
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
      await queryClient.invalidateQueries({
        predicate: (query) =>
          [
            `${productRoute}/count`,
            `${offerRoute}/count`,
            `${route}/${variables.id}/ecommerce-module/catalogue-context`,
          ].includes(String(query.queryKey[0])),
      });
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/ecommerce-module/offers`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      await onSuccess?.(...args);
    },
  });
}

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
