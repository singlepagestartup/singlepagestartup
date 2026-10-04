import {
  Checkbox,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  Lock,
  Wallet,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  paymentMethods,
  type PaymentMethod,
  type PaymentMethodItem,
} from "../../shared";

export interface OrderCheckoutPaymentDefaultProps {
  initialMethod: PaymentMethod;
  agreementLabel: string;
  actionLabel: string;
  backLabel: string;
}

export const defaultOrderCheckoutPaymentDefaultProps: OrderCheckoutPaymentDefaultProps =
  {
    initialMethod: "card",
    agreementLabel:
      "I agree to the Terms of Service and Privacy Policy. All sales are subject to our refund policy.",
    actionLabel: "Place order",
    backLabel: "Back to details",
  };

function PaymentMethodButton({
  method,
  isActive,
  onClick,
}: {
  method: PaymentMethodItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = method.icon;

  return (
    <button
      className={`flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${
        isActive
          ? "border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
          : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] hover:border-[var(--workspace-brand-line)] hover:text-[var(--workspace-brand-foreground)]"
      }`}
      aria-pressed={isActive}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{method.label}</span>
    </button>
  );
}

function CardDetails() {
  return (
    <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
      <h2 className="mb-8 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
        Card details
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          ["card-number", "Card number", "4242 4242 4242 4242", true],
          ["card-name", "Name on card", "John Doe", true],
          ["expiry", "Expiry", "MM/YY", true],
          ["cvc", "CVC", "123", true],
        ].map(([id, label, placeholder, required]) => (
          <div
            className={
              id === "card-number" || id === "card-name" ? "md:col-span-2" : ""
            }
            key={id as string}
          >
            <label
              className="mb-2 block text-sm font-semibold text-[var(--workspace-brand-foreground)]"
              htmlFor={id as string}
            >
              {label}
              {required ? (
                <span className="ml-1 text-[var(--workspace-brand-danger)]">
                  *
                </span>
              ) : null}
            </label>
            <input
              className={kit.field}
              id={id as string}
              placeholder={placeholder as string}
              readOnly
              type="text"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function WalletNotice({ method }: { method: PaymentMethod }) {
  if (method === "paypal") {
    return (
      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
          <Wallet className="h-5 w-5 text-[var(--workspace-brand-muted)]" />
          <p className="max-w-2xl text-base leading-7 text-[var(--workspace-brand-muted)]">
            You will be redirected to PayPal to complete payment.
          </p>
        </div>
      </section>
    );
  }

  if (method === "bank") {
    return (
      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
          Wire transfer details
        </h2>
        <div className="space-y-4 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6 text-base leading-7 text-[var(--workspace-brand-muted)]">
          {[
            ["Bank", "Silicon Valley Bank"],
            ["Account", "****-****-4821"],
            ["Routing", "121-000-248"],
            ["SWIFT", "SVBKUS6S"],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-6" key={label}>
              <span className="text-[var(--workspace-brand-muted)]">
                {label}
              </span>
              <span className="text-right font-[family-name:var(--workspace-brand-font-body)]">
                {value}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-base text-[var(--workspace-brand-muted)]">
          Please include your order number as reference. Payment confirmation
          may take 1-3 business days.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
      <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
        <CircleDollarSign className="h-5 w-5 text-[var(--workspace-brand-muted)]" />
        <p className="max-w-3xl text-base leading-7 text-[var(--workspace-brand-muted)]">
          After placing the order you'll receive a wallet address and payment
          instructions via email.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-base text-[var(--workspace-brand-muted)]">
          {["BTC", "ETH", "USDT", "USDC"].map((currency) => (
            <span
              className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-4 py-1"
              key={currency}
            >
              {currency}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OrderCheckoutPaymentDefault(
  props?: Partial<OrderCheckoutPaymentDefaultProps>,
) {
  const { initialMethod, agreementLabel, actionLabel, backLabel } = {
    ...defaultOrderCheckoutPaymentDefaultProps,
    ...props,
  };
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);

  return (
    <div
      className="w-full min-w-0 space-y-6 lg:space-y-8"
      data-ds-block="ecommerce.order.checkout-payment-default"
      data-ds-layer="singlepage"
    >
      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <h2 className="mb-7 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
          Payment method
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {paymentMethods.map((item) => (
            <PaymentMethodButton
              isActive={item.key === method}
              key={item.key}
              method={item}
              onClick={() => setMethod(item.key)}
            />
          ))}
        </div>
      </section>

      {method === "card" ? <CardDetails /> : <WalletNotice method={method} />}

      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <label className="flex items-start gap-4">
          <Checkbox className="" defaultChecked readOnly />
          <span className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {agreementLabel}
          </span>
        </label>
      </section>

      <div className="flex gap-5">
        <button
          aria-label={backLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
          type="button"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--workspace-brand-accent)] px-5 py-2 text-sm font-semibold text-[var(--workspace-brand-on-accent)] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
          type="button"
        >
          <Lock className="h-6 w-6" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
