import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { ProductOverviewDefault } from "../../../../../ecommerce/models/product/singlepage/overview-default/Component";

export function EcommerceProductFindByIdOverviewDefault() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.ecommerce-product-find-by-id-overview-default"
    >
      <HostNavbarDefault />
      <ProductOverviewDefault />
      <FooterCompact />
    </main>
  );
}
