"use client";
import { useCallback } from "react";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";
import { AdminV2Overview as EcommerceModuleAdminV2Overview } from "@sps/ecommerce/frontend/component";
import { Component as RbacModuleWidget } from "@sps/rbac/models/widget/frontend/component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const storeOfferCreate = useCallback(
    (storeId: string) => (
      <RbacModuleWidget
        isServer={false}
        variant="subject-me-ecommerce-module-offer-create"
        ecommerceModuleStoreId={storeId}
      />
    ),
    [],
  );
  if (!isAdminRoute(props.url, "ecommerce")) {
    return null;
  }
  return (
    <RbacModuleWidget
      isServer={false}
      variant="subject-me-ecommerce-module-catalogue-admin"
    >
      <EcommerceModuleAdminV2Overview
        isServer={false}
        url={props.url}
        storeOfferCreate={storeOfferCreate}
        offerCreate={
          <RbacModuleWidget
            isServer={false}
            variant="subject-me-ecommerce-module-offer-create"
          />
        }
      />
    </RbacModuleWidget>
  );
}
