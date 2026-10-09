import { Component as HostModuleLayout } from "../../../layout";
import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function EcommerceOrderCheckoutConfirmationDefault() {
  return (
    <HostModuleLayout variant="website" activeHref="/checkout" footer="compact">
      <main
        className="min-w-0"
        data-ds-page="host.page.rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-confirmation"
      >
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
      </main>
    </HostModuleLayout>
  );
}
