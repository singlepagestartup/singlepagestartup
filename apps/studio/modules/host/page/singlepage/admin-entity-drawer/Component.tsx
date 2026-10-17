import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product/index";

import { studioProducts } from "../../../../ecommerce/product/shared";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminEntityDrawer({
  variant = "admin-entity-drawer",
}: IComponentProps = {}) {
  return (
    <div
      data-ds-page="host.page.admin-entity-drawer"
      data-module="host"
      data-model="page"
      data-variant={variant}
    >
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Products"
        description="Open product fields and linked records in stacked editing panels."
      >
        <EcommerceModuleProduct
          variant="admin-v2-list"
          initialProduct={studioProducts[0]}
        />
      </AdminV2PageShell>
    </div>
  );
}
