import { EcommerceProductAdminV2List } from "../../../../ecommerce/product/singlepage/admin-v2-list/Component";
import { studioProducts } from "../../../../ecommerce/product/shared";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminEntityDrawer() {
  return (
    <div data-ds-page="host.page.admin-entity-drawer">
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
