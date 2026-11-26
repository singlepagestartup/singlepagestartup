"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReceiptEmail } from "./ReceiptEmail";
import { CheckoutForm } from "./CheckoutForm";
import { OrderComment } from "./OrderComment";
import { FormField } from "@sps/ui-adapter";
import { orderCheckoutAnchor } from "../list/checkout-default/utils";
import { cn } from "@sps/shared-frontend-client-utils";

import { orderCheckoutProviders as providers } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";

const formSchema = z.object({
  provider: z.enum(providers),
  email: z.email(),
  comment: z.string().trim().optional(),
  ecommerceModule: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
      }),
    ),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const order = props.ecommerceModuleOrder;
  const work = order.cartDetails?.work;
  const discussion = order.cartDetails?.discussion;
  const ongoing =
    discussion &&
    work?.state === "awaiting-payment" &&
    work.orderId === order.id &&
    work.storeId === discussion.storeId;
  const discussionHref = ongoing
    ? `/${props.language}/social/chats/${encodeURIComponent(discussion.chatId)}/threads/${encodeURIComponent(discussion.threadId)}`
    : undefined;
  return (
    <OrderCheckout
      key={order.id}
      subject={props.data}
      orderId={order.id}
      language={props.language}
      disabled={props.disabled}
      className={props.className}
      discussionHref={discussionHref}
    />
  );
}

interface IOrderCheckoutProps {
  subject: { id: string; authenticated?: boolean };
  orderId: string;
  language: string;
  disabled?: boolean;
  className?: string;
  discussionHref?: string;
}

export function OrderCheckout(props: IOrderCheckoutProps) {
  const router = useRouter();
  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});
  const [error, setError] = useState("");
  const submitting = useRef(false);

  const checkoutId = orderCheckoutAnchor(props.orderId);
  const revealLinkedCheckout = useCallback(
    (element: HTMLElement | null) => {
      if (!element || window.location.hash !== `#${checkoutId}`) return;
      if (element instanceof HTMLDetailsElement) element.open = true;
      element.scrollIntoView?.({ block: "start" });
    },
    [checkoutId],
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
      comment: "",
      ecommerceModule: {
        orders: [
          {
            id: props.orderId,
          },
        ],
      },
    },
  });

  async function onSubmit({ comment, ...data }: z.infer<typeof formSchema>) {
    if (
      props.disabled ||
      submitting.current ||
      ecommerceModuleOrderCheckout.isPending
    )
      return;
    submitting.current = true;
    setError("");
    try {
      const result = await ecommerceModuleOrderCheckout.mutateAsync({
        id: props.subject.id,
        data: {
          ...data,
          ecommerceModule: { orders: [{ id: props.orderId }] },
          ...(comment ? { comment } : {}),
        },
      });
      const invoice = result.billingModule.invoices[0];
      if (invoice?.provider === "dummy" || invoice?.status === "paid") {
        if (props.discussionHref) {
          router.replace(props.discussionHref);
          return;
        }
      }
      const paymentUrl = invoice?.paymentUrl;
      if (!paymentUrl)
        throw new Error(
          props.language === "ru"
            ? "Платёжная ссылка не получена."
            : "No payment link was returned.",
        );
      window.location.href = paymentUrl;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checkout could not be completed.",
      );
    } finally {
      submitting.current = false;
    }
  }

  const title =
    props.language === "ru" ? "Оплатить этот заказ" : "Pay for this order";
  const className = cn(
    "min-w-0 rounded-xl border border-border",
    props.className,
  );
  const fields = (
    <CheckoutForm
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 border-t border-border p-4"
    >
      <FormField
        ui="shadcn"
        type="select"
        name="provider"
        form={form}
        label={props.language === "ru" ? "Способ оплаты" : "Payment method"}
        placeholder={
          props.language === "ru"
            ? "Выберите способ оплаты"
            : "Select a payment method"
        }
        options={providers.map((provider) => [provider, provider])}
      />
      <ReceiptEmail
        subject={props.subject}
        form={form}
        label={props.language === "ru" ? "Email для чека" : "Receipt email"}
        placeholder="name@example.com"
      />
      <OrderComment form={form} language={props.language} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="min-h-11 w-full rounded-xl"
        disabled={props.disabled || ecommerceModuleOrderCheckout.isPending}
      >
        {props.language === "ru" ? "Перейти к оплате" : "Continue to payment"}
      </Button>
    </CheckoutForm>
  );

  return (
    <Form
      data-module="rbac"
      data-model="subject"
      data-model-id={props.subject.id}
      data-variant="ecommerce-module-order-checkout-default"
      {...form}
    >
      <details id={checkoutId} ref={revealLinkedCheckout} className={className}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          {title}
        </summary>
        {fields}
      </details>
    </Form>
  );
}
