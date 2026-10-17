import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product/index";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModelList({
  variant = "admin-model-list",
}: IComponentProps = {}) {
  return (
    <div
      data-ds-page="host.page.admin-model-list"
      data-module="host"
      data-model="page"
      data-variant={variant}
    >
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Products"
        description="Search product records, create a product or open one for editing."
      >
        <EcommerceModuleProduct variant="admin-v2-list" />
      </AdminV2PageShell>
    </div>
  );
}
