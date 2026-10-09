import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutConfirmationDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-confirmation"
    >
      <HostNavbarDefault activeHref="/checkout" />
      <SectionStack>
        <EcommerceModuleOrder
          variant="checkout-stepper-default"
          currentStep="confirmation"
        />
        <section className="w-full">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <EcommerceModuleOrder variant="checkout-confirmation-default" />
          </div>
        </section>
      </SectionStack>
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
