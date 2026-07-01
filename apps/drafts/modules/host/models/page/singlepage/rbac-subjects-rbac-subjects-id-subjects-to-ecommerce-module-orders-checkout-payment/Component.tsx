import { OrderCheckoutPaymentDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-payment-default/Component";
import { OrderCheckoutStepperDefault } from "../../../../../ecommerce/models/order/singlepage/checkout-stepper-default/Component";
import { OrderSummaryDefault } from "../../../../../ecommerce/models/order/singlepage/summary-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function EcommerceOrderCheckoutPaymentDefault() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-payment"
    >
      <HostNavbarDefault activeHref="/checkout" cartCount={1} />
      <OrderCheckoutStepperDefault currentStep="payment" />
      <section className="w-full py-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
          <OrderCheckoutPaymentDefault />
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummaryDefault compact editable={false} />
          </div>
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
