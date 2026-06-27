import { CheckCircle2, PartyPopper } from "lucide-react";

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
    status: "Confirmed",
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
    continueShoppingLabel: "Continue Shopping",
    continueShoppingHref:
      "?path=/story/modules-host-models-page-singlepage-ecommerce-product-find-card--default",
    homeLabel: "Back to Home",
    homeHref:
      "?path=/story/modules-host-models-page-singlepage-home-default--default",
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
      className="mx-auto w-full max-w-4xl space-y-8"
      data-ds-block="ecommerce.order.checkout-confirmation-default"
      data-ds-layer="singlepage"
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-12 text-center">
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <PartyPopper className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-5 text-xl text-slate-600">
          {description} <span className="text-slate-900">{email}</span>.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="mb-6 text-2xl font-medium text-slate-900">
          Order Details
        </h3>
        <div className="space-y-5">
          {[
            ["Order ID", orderId],
            ["Date", date],
            ["Amount", amount],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-6 text-xl" key={label}>
              <span className="text-slate-500">{label}</span>
              <span className="text-right font-medium text-slate-900">
                {value}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-6 text-xl">
            <span className="text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-base text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {status}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="mb-6 text-2xl font-medium text-slate-900">
          What Happens Next?
        </h3>
        <ol className="space-y-6">
          {nextSteps.map((step, index) => (
            <li className="flex gap-5" key={step.title}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg text-slate-600">
                {index + 1}
              </span>
              <div>
                <p className="text-2xl text-slate-900">{step.title}</p>
                <p className="mt-1 text-xl text-slate-500">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <a
          className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-5 text-xl text-slate-700 no-underline transition hover:bg-slate-50"
          href={continueShoppingHref}
        >
          {continueShoppingLabel}
        </a>
        <a
          className="flex items-center justify-center rounded-xl border border-slate-400 bg-slate-900 px-6 py-5 text-xl text-white no-underline transition hover:bg-slate-800"
          href={homeHref}
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
