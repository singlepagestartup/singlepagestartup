"use client";
import { useCallback } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import {
  CatalogueMutationProvider,
  type ICatalogueMutate,
} from "@sps/rbac/frontend/component/src/lib/admin-v2/catalogue-mutations";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const mutation = api.ecommerceModuleCatalogMutation();
  const mutate: ICatalogueMutate = useCallback(
    (data) => mutation.mutateAsync({ id: props.subjectId, data }),
    [mutation.mutateAsync, props.subjectId],
  );
  return (
    <CatalogueMutationProvider mutate={mutate}>
      {props.children}
    </CatalogueMutationProvider>
  );
}
