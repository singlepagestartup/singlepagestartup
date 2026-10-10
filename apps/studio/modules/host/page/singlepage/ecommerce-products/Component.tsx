import { Component as HostModuleLayout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function EcommerceProductFindCard() {
  return (
    <HostModuleLayout
      variant="website"
      activeHref="/ecommerce/products"
      footer="compact"
    >
      <main
        className="min-w-0"
        data-ds-page="host.page.ecommerce-products"
        data-ds-route="/ecommerce/products"
      >
        <SectionStack>
          <WebsiteBuilderModuleWidget variant="content-page-header" />
          <EcommerceModuleWidget variant="product-find-card" />
        </SectionStack>
      </main>
    </HostModuleLayout>
  );
}
