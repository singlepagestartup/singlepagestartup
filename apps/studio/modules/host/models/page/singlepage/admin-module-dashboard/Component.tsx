import { BlogArticleAdminV2List } from "../../../../../blog/models/article/singlepage/admin-v2-list/Component";
import { EcommerceProductAdminV2List } from "../../../../../ecommerce/models/product/singlepage/admin-v2-list/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModuleDashboard() {
  return (
    <div data-ds-page="host.page.admin-module-dashboard">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Admin module dashboard"
        description="Host page recipe for runnable /admin/:moduleSlug. Inner lists remain module-owned."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <EcommerceProductAdminV2List />
          <BlogArticleAdminV2List />
        </div>
      </AdminV2PageShell>
    </div>
  );
}
