import { CheckCircle2, ChevronRight } from "lucide-react";

import { checkoutSteps, type CheckoutStep } from "../../shared";

export interface OrderCheckoutStepperDefaultProps {
  currentStep: CheckoutStep;
  showBreadcrumb?: boolean;
}

export const defaultOrderCheckoutStepperDefaultProps: OrderCheckoutStepperDefaultProps =
  {
    currentStep: "details",
    showBreadcrumb: true,
  };

export function OrderCheckoutStepperDefault(
  props?: Partial<OrderCheckoutStepperDefaultProps>,
) {
  const { currentStep, showBreadcrumb } = {
    ...defaultOrderCheckoutStepperDefaultProps,
    ...props,
  };
  const currentIndex = checkoutSteps.findIndex(
    (step) => step.key === currentStep,
  );

  return (
    <section
      className="w-full border-b border-slate-200 bg-white py-8"
      data-ds-block="ecommerce.order.checkout-stepper-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {showBreadcrumb ? (
          <nav className="mb-5 flex items-center gap-2 text-base text-slate-400">
            <a
              className="no-underline transition hover:text-slate-600"
              href="/"
            >
              Home
            </a>
            <ChevronRight className="h-4 w-4" />
            <a
              className="no-underline transition hover:text-slate-600"
              href="/services"
            >
              Services
            </a>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-600">Checkout</span>
          </nav>
        ) : null}

        <h1 className="text-4xl tracking-tight text-slate-900">Checkout</h1>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {checkoutSteps.map((step, index) => {
            const done = index < currentIndex;
            const active = step.key === currentStep;

            return (
              <div className="flex items-center gap-3" key={step.key}>
                {index > 0 ? (
                  <div
                    className={`hidden h-px w-12 sm:block ${
                      done ? "bg-slate-400" : "bg-slate-200"
                    }`}
                  />
                ) : null}
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-base ${
                      done
                        ? "bg-slate-900 text-white"
                        : active
                          ? "border border-slate-400 bg-white text-slate-900"
                          : "border border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : step.number}
                  </span>
                  <span
                    className={`text-lg ${
                      active ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
