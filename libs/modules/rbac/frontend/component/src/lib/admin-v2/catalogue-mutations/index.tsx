"use client";
import { createContext, useContext, type ReactNode } from "react";
import { CatalogueMutationProvider as EcommerceCatalogueMutationProvider } from "@sps/ecommerce/frontend/component/src/lib/admin-v2/catalogue-mutations";
import type {
  ICatalogMutationInput,
  ICatalogMutationResult,
} from "@sps/rbac/models/subject/sdk/model";
export type ICatalogueMutate = (
  data: ICatalogMutationInput,
) => Promise<ICatalogMutationResult>;
const CatalogueMutationContext = createContext<ICatalogueMutate | undefined>(
  undefined,
);
export function CatalogueMutationProvider(props: {
  mutate: ICatalogueMutate;
  children: ReactNode;
}) {
  return (
    <CatalogueMutationContext.Provider value={props.mutate}>
      <EcommerceCatalogueMutationProvider mutate={props.mutate}>
        {props.children}
      </EcommerceCatalogueMutationProvider>
    </CatalogueMutationContext.Provider>
  );
}
export function useCatalogueMutationOptions(props: {
  entity:
    | "subjects-to-ecommerce-module-stores"
    | "subjects-to-ecommerce-module-products"
    | "subjects-to-ecommerce-module-orders";
  method: "POST" | "PATCH" | "DELETE";
}) {
  const mutate = useContext(CatalogueMutationContext);
  if (!mutate) {
    return undefined;
  }
  return {
    reactQueryOptions: {
      mutationFn: (variables: {
        id?: string;
        data?: Record<string, unknown>;
      }) => mutate({ ...props, recordId: variables.id, data: variables.data }),
    },
  };
}
