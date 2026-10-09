import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutDetailsDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout"
    >
      <HostNavbarDefault activeHref="/checkout" cartCount={1} />
      <SectionStack>
        <EcommerceModuleOrder
          variant="checkout-stepper-default"
          currentStep="details"
        />
        <section className="w-full">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
            <EcommerceModuleOrder variant="checkout-details-default" />
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <EcommerceModuleOrder variant="summary-default" />
            </div>
          </div>
        </section>
      </SectionStack>
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
