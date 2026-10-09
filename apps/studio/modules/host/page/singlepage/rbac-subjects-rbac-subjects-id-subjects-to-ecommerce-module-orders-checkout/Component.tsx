import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";
import { OrderCheckoutDetailsDefault } from "../../../../ecommerce/order/singlepage/checkout-details-default/Component";
import { OrderCheckoutStepperDefault } from "../../../../ecommerce/order/singlepage/checkout-stepper-default/Component";
import { OrderSummaryDefault } from "../../../../ecommerce/order/singlepage/summary-default/Component";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutDetailsDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout"
    >
      <HostNavbarDefault activeHref="/checkout" cartCount={1} />
      <SectionStack>
        <OrderCheckoutStepperDefault currentStep="details" />
        <section className="w-full">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
            <OrderCheckoutDetailsDefault />
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <OrderSummaryDefault />
            </div>
          </div>
        </section>
      </SectionStack>
      <FooterCompact />
    </main>
  );
}
