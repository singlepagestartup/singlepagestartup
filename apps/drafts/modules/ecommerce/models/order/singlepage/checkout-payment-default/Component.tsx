import { useState } from "react";
import { ArrowLeft, CircleDollarSign, Lock, Wallet } from "lucide-react";

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
    actionLabel: "Place Order",
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
      className={`flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border text-center transition ${
        isActive
          ? "border-slate-400 bg-slate-50 text-slate-900"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-8 w-8" />
      <span className="text-xl">{method.label}</span>
    </button>
  );
}

function CardDetails() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="mb-8 text-2xl font-medium text-slate-900">Card Details</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          ["card-number", "Card Number", "4242 4242 4242 4242", true],
          ["card-name", "Name on Card", "John Doe", true],
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
              className="mb-2 block text-base font-medium text-slate-500"
              htmlFor={id as string}
            >
              {label}
              {required ? <span className="ml-1 text-red-400">*</span> : null}
            </label>
            <input
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-5 text-xl text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
          <Wallet className="h-14 w-14 text-slate-400" />
          <p className="max-w-2xl text-2xl text-slate-600">
            You will be redirected to PayPal to complete payment.
          </p>
        </div>
      </section>
    );
  }

  if (method === "bank") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-6 text-2xl font-medium text-slate-900">
          Wire Transfer Details
        </h2>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-2xl text-slate-600">
          {[
            ["Bank", "Silicon Valley Bank"],
            ["Account", "****-****-4821"],
            ["Routing", "121-000-248"],
            ["SWIFT", "SVBKUS6S"],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-6" key={label}>
              <span className="text-slate-500">{label}</span>
              <span className="text-right font-mono">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xl text-slate-500">
          Please include your order number as reference. Payment confirmation
          may take 1-3 business days.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
        <CircleDollarSign className="h-14 w-14 text-slate-400" />
        <p className="max-w-3xl text-2xl text-slate-600">
          After placing the order you'll receive a wallet address and payment
          instructions via email.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xl text-slate-500">
          {["BTC", "ETH", "USDT", "USDC"].map((currency) => (
            <span
              className="rounded-md border border-slate-200 bg-slate-50 px-4 py-1"
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
      className="space-y-8"
      data-ds-block="ecommerce.order.checkout-payment-default"
      data-ds-layer="singlepage"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-7 text-2xl font-medium text-slate-900">
          Payment Method
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-7">
        <label className="flex items-start gap-4">
          <input
            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked
            readOnly
            type="checkbox"
          />
          <span className="text-xl leading-7 text-slate-500">
            {agreementLabel}
          </span>
        </label>
      </section>

      <div className="flex gap-5">
        <button
          aria-label={backLabel}
          className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
          type="button"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          className="flex h-20 flex-1 items-center justify-center gap-3 rounded-xl border border-slate-400 bg-slate-900 px-6 text-2xl text-white transition hover:bg-slate-800"
          type="button"
        >
          <Lock className="h-6 w-6" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
