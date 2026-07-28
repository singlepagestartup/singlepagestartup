import { OrderCheckoutConfirmationDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-confirmation-default/Component";
import { OrderCheckoutStepperDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-stepper-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutConfirmationDefault() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-confirmation"
    >
      <HostNavbarDefault activeHref="/checkout" />
      <OrderCheckoutStepperDefault currentStep="confirmation" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <OrderCheckoutConfirmationDefault />
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
