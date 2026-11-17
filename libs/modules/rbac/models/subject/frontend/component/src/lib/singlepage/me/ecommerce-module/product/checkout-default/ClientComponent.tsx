"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { route } from "@sps/rbac/models/subject/sdk/model";
import type { IConfiguredPurchase } from "@sps/rbac/models/subject/frontend/component";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { ReceiptEmail } from "../../../../ecommerce-module/order/checkout-default/ReceiptEmail";
import { CheckoutForm } from "../../../../ecommerce-module/order/checkout-default/CheckoutForm";
import { FormField } from "@sps/ui-adapter";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { cn, formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { ArrowRight, CreditCard } from "lucide-react";
import type {
  IComponentPropsExtended,
  ICheckoutFields,
  ICheckoutPriceProps,
  IBillingModuleInvoice,
} from "./interface";
const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "payselection-international",
  "tiptoppay",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;
const formSchema = z.object({
  provider: z
    .string()
    .refine(
      (value) => providers.some((provider) => provider === value),
      "Invalid provider",
    ),
  email: z.email(),
  quantity: z.number().int().positive(),
  comment: z.string().optional(),
  storeId: z.string().optional(),
  billingModule: z.object({
    currency: z.object({ id: z.string().optional() }),
  }),
});
function CheckoutPrice(props: ICheckoutPriceProps) {
  const currencyId = useWatch({
    control: props.form.control,
    name: "billingModule.currency.id",
  });
  const quantity = useWatch({ control: props.form.control, name: "quantity" });
  return currencyId ? (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4 text-sm">
      <span className="text-muted-foreground">
        {props.language === "ru" ? "Цена за единицу" : "Unit price"}
      </span>
      <div className="flex items-center gap-2 font-semibold">
        <Product
          isServer={false}
          variant="price-default"
          dataSource="props"
          data={props.product}
          billingModuleCurrencyId={currencyId}
          language={props.language}
        />
        <span className="text-xs font-normal text-muted-foreground">
          × {quantity || 1}
        </span>
      </div>
    </div>
  ) : null;
}
export function Component(props: IComponentPropsExtended) {
  const checkout = api.ecommerceModuleProductCheckout({});
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<IBillingModuleInvoice[]>([]);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [failedAttempt, setFailedAttempt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingQuote, setRefreshingQuote] = useState(false);
  const [reviewingCart, setReviewingCart] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const submittingRef = useRef(false);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [submittedConfiguration, setSubmittedConfiguration] =
    useState<IConfiguredPurchase | null>(null);
  const [submittedKey, setSubmittedKey] = useState("");
  const [rejectedKey, setRejectedKey] = useState("");
  const liveConfiguration = props.purchaseConfiguration;
  const configuration = submittedConfiguration ?? liveConfiguration;
  const configured =
    liveConfiguration !== undefined || submittedConfiguration !== null;
  const liveKey = liveConfiguration
    ? JSON.stringify([
        liveConfiguration.selection,
        liveConfiguration.storeId,
        liveConfiguration.expectedQuoteVersion,
        liveConfiguration.quote.expiresAt,
      ])
    : "";
  const sourceChanged = Boolean(submittedKey && submittedKey !== liveKey);
  const configurationReady = Boolean(
    configuration &&
    configuration.quote.amount !== null &&
    configuration.quote.issues.length === 0 &&
    configuration.quote.productId === props.ecommerceModuleProduct.id &&
    configuration.quote.offerId === configuration.selection.offerId &&
    configuration.quote.storeId === configuration.storeId &&
    configuration.quote.quantity === configuration.selection.quantity &&
    configuration.quote.currencyId === configuration.selection.currencyId &&
    configuration.quote.version === configuration.expectedQuoteVersion &&
    Boolean(configuration.expectedQuoteVersion) &&
    Number.isSafeInteger(configuration.selection.quantity) &&
    configuration.selection.quantity > 0,
  );
  const form = useForm<ICheckoutFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "dummy",
      email: "",
      quantity: 1,
      comment: "",
      storeId: props.ecommerceModuleStore?.id,
      billingModule: { currency: { id: undefined } },
    },
  });
  async function submit(data: ICheckoutFields) {
    if (
      (configured && !configurationReady) ||
      checkout.isPending ||
      submittingRef.current ||
      paymentCreated ||
      failedAttempt ||
      sourceChanged ||
      (rejectedKey && rejectedKey === liveKey)
    )
      return;
    setError("");
    submittingRef.current = true;
    setSubmitting(true);
    if (configuration) {
      setSubmittedConfiguration(configuration);
      setSubmittedKey(liveKey);
    }
    try {
      const result = await checkout.mutateAsync({
        id: props.data.id,
        productId: props.ecommerceModuleProduct.id,
        data: configuration
          ? {
              provider: data.provider,
              email: data.email,
              comment: data.comment,
              offerId: configuration.selection.offerId,
              storeId: configuration.storeId,
              quantity: configuration.selection.quantity,
              destination: configuration.selection.destination,
              services: configuration.selection.services ?? [],
              expectedQuoteVersion: configuration.expectedQuoteVersion,
              billingModule: {
                currency: { id: configuration.selection.currencyId },
              },
            }
          : data,
      });
      if (!mounted.current) return;
      setPaymentCreated(true);
      const payable = result.billingModule.invoices.filter((invoice) =>
        invoice.paymentUrl?.trim(),
      );
      setInvoices(payable);
      if (!payable.length)
        throw new Error(
          props.language === "ru"
            ? "Платёжная ссылка не получена."
            : "No payment link was returned.",
        );
      if (payable.length !== result.billingModule.invoices.length) {
        throw new Error(
          props.language === "ru"
            ? "Ссылки для оплаты получены не для всех счетов. Проверьте заказ в корзине."
            : "Some invoices have no payment link. Review the order in your cart.",
        );
      }
      if (payable.length === 1) window.location.href = payable[0].paymentUrl!;
    } catch (cause) {
      if (!mounted.current) return;
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message ||
          (props.language === "ru"
            ? "Не удалось оформить заказ."
            : "Checkout could not be completed."),
      );
      if (configured && /Offer terms changed|Quote expired/i.test(message)) {
        setRejectedKey(liveKey);
        setSubmittedConfiguration(null);
        setSubmittedKey("");
        await refreshQuote();
      } else if (
        /^Validation error[.:]|Invalid (?:provider|email)|(?:provider|email).*required|Missing (?:required|field)/i.test(
          message,
        ) ||
        (cause instanceof Error &&
          "status" in cause &&
          (cause.status === 400 || cause.status === 422))
      ) {
        setSubmittedConfiguration(null);
        setSubmittedKey("");
        setFailedAttempt(false);
      } else {
        setFailedAttempt(true);
      }
    } finally {
      submittingRef.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }
  async function refreshQuote() {
    if (!props.onQuoteStale) return;
    setRefreshingQuote(true);
    try {
      await props.onQuoteStale();
    } catch {
      if (!mounted.current) return;
      setError(
        props.language === "ru"
          ? "Не удалось обновить расчёт. Повторите попытку."
          : "Could not refresh the quote. Please retry.",
      );
    } finally {
      if (mounted.current) setRefreshingQuote(false);
    }
  }
  async function reviewCart() {
    setReviewingCart(true);
    setReviewError("");
    try {
      await queries.invalidateQueries(
        { queryKey: [`${route}/${props.data.id}/ecommerce-module/orders`] },
        { throwOnError: true },
      );
    } catch {
      if (!mounted.current) return;
      setReviewError(
        props.language === "ru"
          ? "Не удалось обновить корзину. Повторите попытку."
          : "Could not refresh the cart. Please retry.",
      );
    } finally {
      if (mounted.current) setReviewingCart(false);
    }
  }
  if (
    props.hideWhenIdle &&
    !submitting &&
    !checkout.isPending &&
    !error &&
    !failedAttempt &&
    !paymentCreated &&
    !invoices.length &&
    !Object.keys(form.formState.errors).length
  )
    return null;
  return (
    <details
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "group min-w-0 rounded-xl border border-border bg-card",
        props.className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        <CreditCard size={18} />
        {props.language === "ru" ? "Купить в один шаг" : "One step checkout"}
        <ArrowRight size={16} />
      </summary>
      <div className="border-t border-border p-4">
        <Form {...form}>
          <CheckoutForm
            form={form}
            onSubmit={form.handleSubmit(submit)}
            className="min-w-0 space-y-4"
            noValidate
          >
            {!configured ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {props.language === "ru" ? "Валюта" : "Currency"}
                    </p>
                    <Product
                      isServer={false}
                      variant="currency-toggle-group-default"
                      dataSource="props"
                      data={props.ecommerceModuleProduct}
                      form={form}
                      formFieldName="billingModule.currency.id"
                    />
                  </div>
                  <FormField
                    ui="shadcn"
                    type="number"
                    min={1}
                    step={1}
                    name="quantity"
                    form={form}
                    label={props.language === "ru" ? "Количество" : "Quantity"}
                    className="max-w-28"
                    inputClassName="rounded-xl"
                  />
                </div>
                <CheckoutPrice
                  form={form}
                  product={props.ecommerceModuleProduct}
                  language={props.language}
                />
              </>
            ) : configurationReady && configuration ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4 text-sm">
                <span>{props.language === "ru" ? "Итого" : "Total"}</span>
                <output
                  aria-label={
                    props.language === "ru" ? "Сумма к оплате" : "Payment total"
                  }
                  className="font-semibold tabular-nums"
                >
                  {formatCurrencyAmount(
                    configuration.quote.amount!,
                    props.language,
                  )}{" "}
                  {configuration.currencySymbol}
                </output>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {props.language === "ru"
                  ? "Завершите выбор товара, получения и услуг."
                  : "Complete the product, fulfillment and service selection."}
              </p>
            )}
            <FormField
              ui="shadcn"
              type="select"
              name="provider"
              form={form}
              label={
                props.language === "ru" ? "Способ оплаты" : "Payment method"
              }
              placeholder={
                props.language === "ru"
                  ? "Выберите способ оплаты"
                  : "Select provider"
              }
              options={providers.map((provider) => [provider, provider])}
              inputClassName="rounded-xl"
            />
            <ReceiptEmail
              subject={props.data}
              form={form}
              label={
                props.language === "ru" ? "Email для счёта" : "Email for a bill"
              }
              placeholder="you@example.com"
              inputClassName="rounded-xl"
            />
            <FormField
              ui="shadcn"
              type="text"
              name="comment"
              form={form}
              label={props.language === "ru" ? "Комментарий" : "Comment"}
              inputClassName="rounded-xl"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {failedAttempt || (paymentCreated && error) ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {props.language === "ru"
                    ? "Проверьте заказ в корзине перед повторной оплатой."
                    : "Review the order in your cart before trying payment again."}
                </p>
                <Button
                  type="button"
                  disabled={reviewingCart}
                  onClick={() => void reviewCart()}
                  className="min-h-11 rounded-xl"
                >
                  {props.language === "ru"
                    ? "Обновить корзину"
                    : "Refresh cart"}
                </Button>
                {reviewError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {reviewError}
                  </p>
                ) : null}
              </div>
            ) : null}
            {rejectedKey &&
            (!liveKey || rejectedKey === liveKey) &&
            props.onQuoteStale ? (
              <Button
                type="button"
                disabled={submitting || refreshingQuote}
                onClick={() => void refreshQuote()}
                className="min-h-11 rounded-xl"
              >
                {props.language === "ru" ? "Обновить расчёт" : "Refresh quote"}
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              disabled={
                checkout.isPending ||
                submitting ||
                (configured && !configurationReady) ||
                paymentCreated ||
                failedAttempt ||
                sourceChanged ||
                Boolean(rejectedKey && rejectedKey === liveKey)
              }
              className="min-h-11 w-full rounded-xl"
            >
              {checkout.isPending || submitting
                ? props.language === "ru"
                  ? "Оформляем…"
                  : "Processing…"
                : props.language === "ru"
                  ? "Перейти к оплате"
                  : "Continue to payment"}
            </Button>
          </CheckoutForm>
        </Form>
        {invoices.length ? (
          <div className="mt-4 space-y-3">
            <p role="status" className="text-sm">
              {props.language === "ru"
                ? "Выберите счёт для оплаты."
                : "Choose an invoice to pay."}
            </p>
            <ul className="space-y-2">
              {invoices.map((invoice, index) => (
                <li key={invoice.id}>
                  <a
                    href={invoice.paymentUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                  >
                    {props.language === "ru" ? "Оплатить счёт" : "Pay invoice"}{" "}
                    {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
