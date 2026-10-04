import { SectionStack } from "../../../../../../workspace/design/singlepage/interface-kit/SectionStack";
import { OrderCheckoutConfirmationDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-confirmation-default/Component";
import { OrderCheckoutStepperDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-stepper-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutConfirmationDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-confirmation"
    >
      <HostNavbarDefault activeHref="/checkout" />
      <SectionStack>
        <OrderCheckoutStepperDefault currentStep="confirmation" />
        <section className="w-full">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <OrderCheckoutConfirmationDefault />
          </div>
        </section>
      </SectionStack>
      <FooterCompact />
    </main>
  );
}
