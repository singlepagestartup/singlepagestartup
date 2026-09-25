import { EcommerceProductAdminV2Form } from "../../../../../ecommerce/models/product/singlepage/admin-v2-form/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminEntityDrawer() {
  return (
    <div data-ds-page="host.page.admin-entity-drawer">
      <AdminV2PageShell
        activePath="/admin/ecommerce/product"
        eyebrow="host.page"
        title="Admin entity drawer"
        description="Host page recipe for the runnable EntityDrawer state with model-owned form content."
      >
        <div className="rounded-3xl border border-slate-300 bg-slate-200 p-4">
          <div className="ml-auto max-w-4xl rounded-2xl bg-white p-4 shadow-xl">
            <EcommerceProductAdminV2Form />
          </div>
        </div>
      </AdminV2PageShell>
    </div>
  );
}
