import { EcommerceProductAdminV2Form } from "../../../../../ecommerce/models/product/singlepage/admin-v2-form/Component";
import { EcommerceProductsToAttributesAdminV2Manager } from "../../../../../ecommerce/relations/products-to-attributes/singlepage/admin-v2-manager/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModelEdit() {
  return (
    <div data-ds-page="host.page.admin-model-edit">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Admin model edit"
        description="Host page recipe for runnable /admin/:moduleSlug/:modelSlug/:id."
      >
        <EcommerceProductAdminV2Form />
        <EcommerceProductsToAttributesAdminV2Manager />
      </AdminV2PageShell>
    </div>
  );
}
