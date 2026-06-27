import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { ContentPageHeader } from "../../../../../website-builder/models/widget/singlepage/content-page-header/Component";
import { ProductFindCard } from "../../../../../ecommerce/models/widget/singlepage/product-find-card/Component";

export function EcommerceProductFindCard() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.ecommerce-product-find-card"
    >
      <HostNavbarDefault />
      <ContentPageHeader />
      <ProductFindCard />
      <FooterCompact />
    </main>
  );
}
