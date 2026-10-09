import { Component as BlogModuleArticle } from "../../../../blog/article";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminDashboard() {
  return (
    <div data-ds-page="host.page.admin-dashboard">
      <AdminV2PageShell
        activePath="/admin"
        eyebrow="host.page"
        title="Workspace overview"
        description="Browse product and article records, then review your account settings."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <EcommerceModuleProduct variant="admin-v2-list" />
          <BlogModuleArticle variant="admin-v2-list" />
        </div>
        <RbacModuleSubject variant="admin-v2-settings" />
      </AdminV2PageShell>
    </div>
  );
}
