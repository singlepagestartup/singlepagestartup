import { EcommerceProductsToAttributesAdminV2Manager } from "../../../../../ecommerce/relations/products-to-attributes/singlepage/admin-v2-manager/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminRelationManager() {
  return (
    <div data-ds-page="host.page.admin-relation-manager">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Admin relation manager"
        description="Host page recipe for runnable RelationManager, with relation-owned reusable UI."
      >
        <EcommerceProductsToAttributesAdminV2Manager />
      </AdminV2PageShell>
    </div>
  );
}
