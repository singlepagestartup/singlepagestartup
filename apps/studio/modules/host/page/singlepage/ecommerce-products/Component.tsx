import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function EcommerceProductFindCard() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.ecommerce-products"
      data-ds-route="/ecommerce/products"
    >
      <HostNavbarDefault activeHref="/ecommerce/products" />
      <SectionStack>
        <WebsiteBuilderModuleWidget variant="content-page-header" />
        <EcommerceModuleWidget variant="product-find-card" />
      </SectionStack>
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
