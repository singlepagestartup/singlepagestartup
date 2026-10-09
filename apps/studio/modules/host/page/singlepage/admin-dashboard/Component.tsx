import { BlogArticleAdminV2List } from "../../../../blog/article/singlepage/admin-v2-list/Component";
import { EcommerceProductAdminV2List } from "../../../../ecommerce/product/singlepage/admin-v2-list/Component";
import { RbacSubjectAdminV2Settings } from "../../../../rbac/subject/singlepage/admin-v2-settings/Component";
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
          <EcommerceProductAdminV2List />
          <BlogArticleAdminV2List />
        </div>
        <RbacSubjectAdminV2Settings />
      </AdminV2PageShell>
    </div>
  );
}
