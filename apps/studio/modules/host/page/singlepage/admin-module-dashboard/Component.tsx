import { Component as BlogModuleArticle } from "../../../../blog/article";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModuleDashboard() {
  return (
    <div data-ds-page="host.page.admin-module-dashboard">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Module records"
        description="Explore the models in this module and open a record to edit its fields."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <EcommerceModuleProduct variant="admin-v2-list" />
          <BlogModuleArticle variant="admin-v2-list" />
        </div>
      </AdminV2PageShell>
    </div>
  );
}
