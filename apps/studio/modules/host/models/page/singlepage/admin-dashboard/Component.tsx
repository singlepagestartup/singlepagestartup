import { BlogArticleAdminV2List } from "../../../../../blog/models/article/singlepage/admin-v2-list/Component";
import { EcommerceProductAdminV2List } from "../../../../../ecommerce/models/product/singlepage/admin-v2-list/Component";
import { RbacSubjectAdminV2Settings } from "../../../../../rbac/models/subject/singlepage/admin-v2-settings/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminDashboard() {
  return (
    <div data-ds-page="host.page.admin-dashboard">
      <AdminV2PageShell
        activePath="/admin"
        eyebrow="host.page"
        title="Admin dashboard"
        description="Host-owned page recipe for the runnable /admin route. It composes module-owned admin-v2 blocks instead of preserving the runnable router shell."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <EcommerceProductAdminV2List />
          <BlogArticleAdminV2List />
        </div>
        <RbacSubjectAdminV2Settings />
      </AdminV2PageShell>
    </div>
  );
}
