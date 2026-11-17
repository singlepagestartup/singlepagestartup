"use client";
import { createContext, useContext, type ReactNode } from "react";

export interface ICatalogueMutation {
  entity:
    | "stores"
    | "products"
    | "attributes"
    | "attribute-keys"
    | "stores-to-products"
    | "offers-to-offers"
    | "stores-to-attributes"
    | "products-to-attributes"
    | "stores-to-products-to-attributes"
    | "attribute-keys-to-attributes"
    | "attributes-to-billing-module-currencies";
  method: "POST" | "PATCH" | "DELETE";
  recordId?: string;
  data?: Record<string, unknown>;
}
export type ICatalogueMutate = (
  props: ICatalogueMutation,
) => Promise<{ id: string; [key: string]: unknown }>;
const CatalogueMutationContext = createContext<ICatalogueMutate | undefined>(
  undefined,
);

export function CatalogueMutationProvider(props: {
  mutate: ICatalogueMutate;
  children: ReactNode;
}) {
  return (
    <CatalogueMutationContext.Provider value={props.mutate}>
      {props.children}
    </CatalogueMutationContext.Provider>
  );
}

export function useCatalogueMutationOptions(
  props: Pick<ICatalogueMutation, "entity" | "method">,
) {
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
