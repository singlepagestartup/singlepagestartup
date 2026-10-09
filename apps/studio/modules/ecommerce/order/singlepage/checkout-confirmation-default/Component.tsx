import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { PartyPopper } from "../../../../../workspace/utils/components/ModuleIcons";

export interface OrderCheckoutNextStep {
  title: string;
  description: string;
}

export interface OrderCheckoutConfirmationDefaultProps {
  title: string;
  description: string;
  email: string;
  orderId: string;
  date: string;
  amount: string;
  status: string;
  nextSteps: OrderCheckoutNextStep[];
  continueShoppingLabel: string;
  continueShoppingHref: string;
  homeLabel: string;
  homeHref: string;
}

export const defaultOrderCheckoutConfirmationDefaultProps: OrderCheckoutConfirmationDefaultProps =
  {
    title: "Thank you for your order!",
    description:
      "Your order has been placed successfully. We'll send a confirmation to",
    email: "john@example.com",
    orderId: "ORD-MQU3TTK5",
    date: "June 26, 2026",
    amount: "$225",
    status: "paid",
    nextSteps: [
      {
        title: "Confirmation Email",
        description:
          "You'll receive an order confirmation and invoice within a few minutes.",
      },
      {
        title: "Discovery Call",
        description:
          "Our team will reach out within 24 hours to schedule a kickoff meeting.",
      },
      {
        title: "Project Kickoff",
        description:
          "We start working on your project according to the agreed timeline.",
      },
    ],
    continueShoppingLabel: "Continue shopping",
    continueShoppingHref:
      "/?path=/story/modules-host-models-page-singlepage-ecommerce-products--default",
    homeLabel: "Back to home",
    homeHref: "/?path=/story/modules-host-models-page-singlepage-root--default",
  };

export function OrderCheckoutConfirmationDefault(
  props?: Partial<OrderCheckoutConfirmationDefaultProps>,
) {
  const {
    title,
    description,
    email,
    orderId,
    date,
    amount,
    status,
    nextSteps,
    continueShoppingLabel,
    continueShoppingHref,
    homeLabel,
    homeHref,
  } = {
    ...defaultOrderCheckoutConfirmationDefaultProps,
    ...props,
  };

  return (
    <div
      className="w-full min-w-0 space-y-6 lg:space-y-8"
      data-ds-block="ecommerce.order.checkout-confirmation-default"
      data-ds-layer="singlepage"
    >
      <section className="flex flex-col gap-5 rounded-3xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:flex-row sm:items-start sm:p-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
          <PartyPopper className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 break-words text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
            {description}{" "}
            <span className="font-semibold text-[var(--workspace-brand-on-primary)]">
              {email}
            </span>
            .
          </p>
        </div>
      </section>
      <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="min-w-0 rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:h-full">
          <h3 className="text-xl font-semibold">Order details</h3>
          <dl className="mt-6 divide-y divide-[var(--workspace-brand-line)]">
            {[
              ["Order ID", orderId],
              ["Date", date],
              ["Amount", amount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-4 text-sm"
              >
                <dt className="text-[var(--workspace-brand-muted)]">{label}</dt>
                <dd className="min-w-0 break-words text-right font-semibold">
                  {value}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-4 text-sm">
              <dt className="text-[var(--workspace-brand-muted)]">Status</dt>
              <dd className="inline-flex items-center gap-2 rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1.5 text-sm font-medium text-[var(--workspace-brand-on-accent)]">
                <Icon name="check" />
                {status
                  .replaceAll("_", " ")
                  .replace(/^./, (letter) => letter.toUpperCase())}
              </dd>
            </div>
          </dl>
        </section>
        <section className="min-w-0 rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:h-full">
          <h3 className="text-xl font-semibold">What happens next?</h3>
          <ol className="mt-6 space-y-6">
            {nextSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--workspace-brand-background)] text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="text-base font-semibold leading-6">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="flex flex-wrap gap-3">
        <a className={kit.button} href={continueShoppingHref}>
          {continueShoppingLabel}
        </a>
        <a className={kit.secondary} href={homeHref}>
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
