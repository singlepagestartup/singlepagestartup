import {
  Check,
  ChevronRight,
} from "../../../../../../workspace/utils/components/ModuleIcons";

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
      className="w-full py-8 sm:py-12"
      data-ds-block="ecommerce.order.checkout-stepper-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {showBreadcrumb ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--workspace-brand-muted)]"
          >
            <a
              className="rounded hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
              href="/"
            >
              Home
            </a>
            <ChevronRight className="h-5 w-5" />
            <a
              className="rounded hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
              href="/ecommerce/products"
            >
              Services
            </a>
            <ChevronRight className="h-5 w-5" />
            <span aria-current="page">Checkout</span>
          </nav>
        ) : null}
        <h1 className="text-4xl font-semibold leading-tight text-[var(--workspace-brand-foreground)] sm:text-5xl">
          Checkout
        </h1>
        <nav aria-label="Checkout progress" className="mt-8">
          <ol className="grid w-full grid-cols-3 gap-2 rounded-2xl bg-[var(--workspace-brand-line)]/50 p-2">
            {checkoutSteps.map((step, index) => {
              const done = index < currentIndex;
              const active = step.key === currentStep;
              return (
                <li
                  key={step.key}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-w-0 flex-col items-center gap-2 rounded-xl p-3 sm:flex-row sm:gap-3 ${active ? "bg-[var(--workspace-brand-surface)]" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]" : active ? "bg-[var(--workspace-brand-primary)] text-[var(--workspace-brand-on-primary)]" : "bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)]"}`}
                  >
                    {done ? <Check className="h-5 w-5" /> : step.number}
                  </span>
                  <span
                    className={`text-center text-xs sm:text-sm ${active ? "font-semibold text-[var(--workspace-brand-foreground)]" : "text-[var(--workspace-brand-muted)]"}`}
                  >
                    {step.label}
                  </span>
                  {done ? <span className="sr-only">Completed</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </section>
  );
}
