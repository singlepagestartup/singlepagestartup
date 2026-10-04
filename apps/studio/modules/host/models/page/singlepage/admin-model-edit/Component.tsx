import { EcommerceProductAdminV2List } from "../../../../../ecommerce/models/product/singlepage/admin-v2-list/Component";
import { studioProducts } from "../../../../../ecommerce/models/product/shared";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminModelEdit() {
  return (
    <div data-ds-page="host.page.admin-model-edit">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Products"
        description="Open product fields and linked records in stacked editing panels."
      >
        <EcommerceProductAdminV2List initialProduct={studioProducts[0]} />
      </AdminV2PageShell>
    </div>
  );
}
