import { Component as HostModuleLayout } from "../../../layout";
import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function EcommerceOrderCheckoutDetailsDefault() {
  return (
    <HostModuleLayout
      variant="website"
      activeHref="/checkout"
      cartCount={1}
      footer="compact"
    >
      <main
        className="min-w-0"
        data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout"
      >
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
      </main>
    </HostModuleLayout>
  );
}
