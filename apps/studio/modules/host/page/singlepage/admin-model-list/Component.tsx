import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModelList() {
  return (
    <div data-ds-page="host.page.admin-model-list">
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
