import { EcommerceProductAdminV2List } from "../../../../../ecommerce/models/product/singlepage/admin-v2-list/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModelList() {
  return (
    <div data-ds-page="host.page.admin-model-list">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Admin model list"
        description="Host page recipe for runnable /admin/:moduleSlug/:modelSlug."
      >
        <EcommerceProductAdminV2List />
      </AdminV2PageShell>
    </div>
  );
}
