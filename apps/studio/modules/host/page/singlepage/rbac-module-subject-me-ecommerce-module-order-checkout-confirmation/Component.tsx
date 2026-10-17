import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { ReactNode as ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as Layout } from "../../../layout/index";
import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order/index";
interface SectionStackProps {
  children: ReactNode;
  className?: string;
}
function SectionStack({ children, className }: SectionStackProps) {
  return (
    <div
      className={twMerge(
        "flex min-w-0 w-full flex-col gap-6 py-6 sm:gap-8 sm:py-8 [&>[data-ds-block]]:py-0 [&>[data-ds-section]]:py-0 [&>section]:py-0",
        className,
      )}
      data-ds-layout="section-stack"
    >
      {children}
    </div>
  );
}

export function EcommerceOrderCheckoutConfirmationDefault({
  variant = "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" activeHref="/checkout" footer="compact">
        <main
          className="min-w-0"
          data-ds-page="host.page.rbac-module-subject-me-ecommerce-module-order-checkout-confirmation"
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
      </Layout>
    </div>
  );
}
