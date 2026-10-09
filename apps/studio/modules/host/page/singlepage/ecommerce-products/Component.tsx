import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
import { ContentPageHeader } from "../../../../website-builder/widget/singlepage/content-page-header/Component";
import { ProductFindCard } from "../../../../ecommerce/widget/singlepage/product-find-card/Component";

export function EcommerceProductFindCard() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.ecommerce-products"
      data-ds-route="/ecommerce/products"
    >
      <HostNavbarDefault activeHref="/ecommerce/products" />
      <SectionStack>
        <ContentPageHeader />
        <ProductFindCard />
      </SectionStack>
      <FooterCompact />
    </main>
  );
}
