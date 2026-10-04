import { EcommerceProductsToAttributesAdminV2Manager } from "../../../../../ecommerce/relations/products-to-attributes/singlepage/admin-v2-manager/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminRelationManager() {
  return (
    <div data-ds-page="host.page.admin-relation-manager">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Product connections"
        description="Link products to attributes and control the order of each connection."
      >
        <EcommerceProductsToAttributesAdminV2Manager />
      </AdminV2PageShell>
    </div>
  );
}
