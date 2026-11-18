"use client";

import type { IComponentPropsExtended } from "./interface";
export type { OrderCheckoutPaymentDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type InputHTMLAttributes,
  forwardRef as forwardRefPresentation,
  type SVGProps,
  memo,
  useCallback,
  useId,
  useState,
} from "react";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  paymentMethods,
  formatOrderMoney,
  type PaymentMethod,
  type PaymentMethodItem,
} from "../../shared";
import type { IOrderInvoice, IOrderSubscriptionPeriod } from "../../interface";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRefPresentation<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMergePresentation("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
interface ICheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

const PaymentMethodButton = memo(function PaymentMethodButton({
  method,
  isActive,
  onSelect,
}: {
  method: PaymentMethodItem;
  isActive: boolean;
  onSelect: (method: PaymentMethod) => void;
}) {
  const Icon = method.icon;
  const handleClick = useCallback(
    () => onSelect(method.key),
    [method.key, onSelect],
  );
  return (
    <button
      className={`flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
        isActive
          ? "border-foreground bg-muted text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
      }`}
      aria-pressed={isActive}
      onClick={handleClick}
      type="button"
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{method.label}</span>
    </button>
  );
});

const InvoiceChoice = memo(function InvoiceChoice({
  invoice,
  selected,
  paid,
  groupName,
  onSelect,
}: {
  invoice: IOrderInvoice;
  selected: boolean;
  paid: boolean;
  groupName: string;
  onSelect: (id: string) => void;
}) {
  const handleChange = useCallback(
    () => onSelect(invoice.id),
    [invoice.id, onSelect],
  );
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-4 ${selected ? "border-foreground bg-muted" : "border-border bg-card"}`}
    >
      <input
        type="radio"
        name={groupName}
        value={invoice.id}
        checked={selected}
        onChange={handleChange}
        className="mt-1 size-4 shrink-0 accent-foreground"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap justify-between gap-2 font-semibold">
          <span className="break-all">{invoice.id}</span>
          <span className="tabular-nums">
            {formatOrderMoney(invoice.amount, invoice.currency)}
          </span>
        </span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">
          {invoice.description}
        </span>
        <span className="mt-2 block text-xs text-muted-foreground">
          {invoice.orderIds.join(" · ")}
        </span>
        <span className="mt-3 inline-block rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
          {paid
            ? "Paid"
            : invoice.status === "cancelled"
              ? "Cancelled"
              : "Awaiting payment"}
        </span>
      </span>
    </label>
  );
});

const PeriodChoice = memo(function PeriodChoice({
  period,
  selected,
  groupName,
  onSelect,
}: {
  period: IOrderSubscriptionPeriod;
  selected: boolean;
  groupName: string;
  onSelect: (id: string) => void;
}) {
  const handleChange = useCallback(
    () => onSelect(period.id),
    [period.id, onSelect],
  );
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-4 ${selected ? "border-foreground bg-muted" : "border-border bg-card"}`}
    >
      <input
        type="radio"
        name={groupName}
        value={period.id}
        checked={selected}
        onChange={handleChange}
        className="mt-1 size-4 shrink-0 accent-foreground"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap justify-between gap-2 font-semibold">
          <span>{period.label}</span>
          <span className="tabular-nums">
            {formatOrderMoney(period.amount, period.currency)}
          </span>
        </span>
        <span className="mt-2 block text-sm text-muted-foreground">
          {period.date}
        </span>
      </span>
    </label>
  );
});
function CardDetails() {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <h2 className="mb-8 text-2xl font-semibold text-foreground">
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
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor={id as string}
            >
              {label}
              {required ? (
                <span className="ml-1 text-destructive">*</span>
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
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            You will be redirected to PayPal to complete payment.
          </p>
        </div>
      </section>
    );
  }
  if (method === "bank") {
    return (
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          Wire transfer details
        </h2>
        <div className="space-y-4 rounded-xl border border-border bg-muted p-6 text-base leading-7 text-muted-foreground">
          {[
            ["Bank", "Silicon Valley Bank"],
            ["Account", "****-****-4821"],
            ["Routing", "121-000-248"],
            ["SWIFT", "SVBKUS6S"],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-6" key={label}>
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-default">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-base text-muted-foreground">
          Please include your order number as reference. Payment confirmation
          may take 1-3 business days.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <div className="flex min-h-56 flex-col items-center justify-center gap-6 text-center">
        <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          After placing the order you'll receive a wallet address and payment
          instructions via email.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-base text-muted-foreground">
          {["BTC", "ETH", "USDT", "USDC"].map((currency) => (
            <span
              className="rounded-xl border border-border bg-muted px-4 py-1"
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
export function OrderCheckoutPaymentDefaultClient(
  props: IComponentPropsExtended,
) {
  const {
    initialMethod,
    agreementLabel,
    actionLabel,
    backLabel,
    invoiceChoices,
    initialInvoiceId,
    subscriptionPeriods,
    initialPeriodId,
  } = props;
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [periodId, setPeriodId] = useState(initialPeriodId);
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [agreement, setAgreement] = useState(true);
  const choiceGroupId = useId();
  const selectedPeriod =
    subscriptionPeriods?.find((period) => period.id === periodId) ??
    subscriptionPeriods?.[0];
  const selectedInvoice = selectedPeriod
    ? undefined
    : (invoiceChoices?.find((invoice) => invoice.id === invoiceId) ??
      invoiceChoices?.[0]);
  const selectedChoice = selectedPeriod ?? selectedInvoice;
  const paid = Boolean(
    selectedChoice &&
    (paidIds.includes(selectedChoice.id) || selectedInvoice?.status === "paid"),
  );
  const cancelled = selectedInvoice?.status === "cancelled";
  const selectMethod = useCallback(
    (method: PaymentMethod) => setMethod(method),
    [],
  );
  const selectInvoice = useCallback((id: string) => setInvoiceId(id), []);
  const selectPeriod = useCallback((id: string) => setPeriodId(id), []);
  const changeAgreement = useCallback(
    () => setAgreement((value) => !value),
    [],
  );
  const paySelectedChoice = useCallback(() => {
    if (!selectedChoice || paid || cancelled || !agreement) return;
    setPaidIds((ids) =>
      ids.includes(selectedChoice.id) ? ids : [...ids, selectedChoice.id],
    );
  }, [selectedChoice, paid, cancelled, agreement]);
  const selectedAmount = selectedChoice
    ? formatOrderMoney(selectedChoice.amount, selectedChoice.currency)
    : "";
  const payLabel = paid
    ? "Paid"
    : cancelled
      ? "Invoice cancelled"
      : selectedPeriod
        ? `${selectedPeriod.paymentMode === "automatic" ? "Confirm subscription" : "Pay this period"} · ${selectedAmount}`
        : selectedInvoice
          ? `Pay invoice · ${selectedAmount}`
          : actionLabel;
  return (
    <div
      className="w-full min-w-0 space-y-6 lg:space-y-8"
      data-ds-block="ecommerce.order.checkout-payment-default"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="order"
      data-variant={props?.variant ?? "checkout-payment-default"}
    >
      {invoiceChoices?.length && !selectedPeriod ? (
        <fieldset className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-8">
          <legend className="px-2 text-xl font-semibold">Choose invoice</legend>
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            Each currency has its own invoice. Pay one invoice at a time.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {invoiceChoices.map((invoice) => (
              <InvoiceChoice
                key={invoice.id}
                invoice={invoice}
                selected={selectedInvoice?.id === invoice.id}
                paid={invoice.status === "paid" || paidIds.includes(invoice.id)}
                groupName={`${choiceGroupId}-invoice`}
                onSelect={selectInvoice}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      {selectedPeriod ? (
        <section className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-8">
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 text-xl font-semibold">
              Subscription deliveries
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptionPeriods?.map((period) => (
                <PeriodChoice
                  key={period.id}
                  period={period}
                  selected={period.id === selectedPeriod.id}
                  groupName={`${choiceGroupId}-period`}
                  onSelect={selectPeriod}
                />
              ))}
            </div>
          </fieldset>
          <p className="text-sm leading-6 text-muted-foreground">
            {selectedPeriod.note}
          </p>
          <ul
            className="space-y-3 border-t border-border pt-5"
            aria-label="Charges for selected delivery"
          >
            {selectedPeriod.charges.map((charge) => (
              <li
                key={charge.id}
                className={`flex justify-between gap-4 text-sm ${charge.kind === "product" ? "font-semibold" : "ml-4 border-l border-border pl-4"}`}
              >
                <span>
                  {charge.title} × {charge.quantity}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {charge.schedule === "first-delivery"
                      ? "First delivery only"
                      : "Every delivery"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatOrderMoney(charge.amount, selectedPeriod.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-4 border-t border-border pt-4 font-semibold">
            <span>This delivery</span>
            <span>{selectedAmount}</span>
          </p>
        </section>
      ) : null}
      {paid ? (
        <p
          role="status"
          className="rounded-2xl border border-border bg-muted px-5 py-4 text-sm leading-6"
        >
          {selectedInvoice
            ? `${selectedInvoice.id} is paid. The other invoice keeps its own payment status.`
            : `${selectedPeriod?.label} is paid. Each later period has its own payment.`}
        </p>
      ) : cancelled ? (
        <p
          role="status"
          className="rounded-2xl border border-border bg-muted px-5 py-4 text-sm"
        >
          This invoice is cancelled. Return to checkout to request a new
          invoice.
        </p>
      ) : (
        <>
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
            <h2 className="mb-7 text-2xl font-semibold text-foreground">
              Payment method
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {paymentMethods.map((item) => (
                <PaymentMethodButton
                  isActive={item.key === method}
                  key={item.key}
                  method={item}
                  onSelect={selectMethod}
                />
              ))}
            </div>
          </section>

          {method === "card" ? (
            <CardDetails />
          ) : (
            <WalletNotice method={method} />
          )}

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
            <label className="flex items-start gap-4">
              <Checkbox checked={agreement} onChange={changeAgreement} />
              <span className="text-sm leading-6 text-muted-foreground">
                {agreementLabel}
              </span>
            </label>
          </section>
        </>
      )}

      <div className="flex gap-5">
        <button
          aria-label={backLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          type="button"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          type="button"
          disabled={paid || cancelled || !agreement}
          onClick={selectedChoice ? paySelectedChoice : undefined}
        >
          <Lock className="h-6 w-6" />
          {payLabel}
        </button>
      </div>
    </div>
  );
}
const Wallet = createIcon("wallet");
const Lock = createIcon("lock-key");
const CircleDollarSign = createIcon("currency-circle-dollar");
const ArrowLeft = createIcon("arrow-left");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border bg-card text-foreground checked:border-transparent checked:bg-primary indeterminate:border-transparent indeterminate:bg-primary disabled:cursor-not-allowed",
  focus: focus,
};
const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center has-[:disabled]:opacity-50">
      <input
        ref={ref}
        type="checkbox"
        className={twMerge(kit.checkbox, kit.focus, className)}
        {...props}
      />
      <Icon
        name="check"
        className="pointer-events-none absolute h-3.5 w-3.5 text-foreground opacity-0 peer-checked:opacity-100 peer-indeterminate:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute hidden h-0.5 w-2.5 rounded-full bg-default peer-indeterminate:block"
      />
    </span>
  );
});
