"use client";

import { useEffect, useRef } from "react";
import { Button } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICustomerWorkView,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import type { readOrderCheckoutButtons } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";

interface IProps {
  subjectId: string;
  work: ICustomerWorkView;
  language: string;
}
type Input = Extract<
  TCustomerWorkCommand,
  { operation: "chat-checkout" }
>["input"];

function useCheckout(props: IProps) {
  const { mutateAsync, isPending, error } = api.changeCustomerWork();
  async function send(input: Input) {
    const result = await mutateAsync({
      id: props.subjectId,
      data: {
        operation: "chat-checkout",
        taskId: props.work.taskId,
        storeId: props.work.storeId,
        operationKey: crypto.randomUUID(),
        input,
      },
    });
    if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
  }
  return { send, isPending, error };
}

export function StartOrderPayment(props: IProps) {
  const { send, error, isPending } = useCheckout(props);
  const attempted = useRef("");
  const key = props.work.taskId;
  useEffect(() => {
    if (attempted.current === key) return;
    attempted.current = key;
    void send({ kind: "begin" }).catch(() => {});
  }, [key, send]);
  if (!error) return null;
  return (
    <div role="alert" className="flex items-center gap-2 text-sm">
      {props.language === "ru"
        ? "Не удалось загрузить способы оплаты."
        : "Could not load payment methods."}
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => void send({ kind: "begin" }).catch(() => {})}
      >
        {props.language === "ru" ? "Повторить" : "Retry"}
      </Button>
    </div>
  );
}

export function OrderPaymentButtons(
  props: IProps & {
    messageId: string;
    rows: NonNullable<ReturnType<typeof readOrderCheckoutButtons>>;
  },
) {
  const { send, error, isPending } = useCheckout(props);
  return (
    <div className="mt-3 grid gap-2">
      {props.rows.map((row) => (
        <div
          key={row.map((b) => b.text).join("|")}
          className="flex flex-wrap gap-2"
        >
          {row.map((button) =>
            "url" in button ? (
              <Button key={button.url} asChild>
                <a href={button.url}>{button.text}</a>
              </Button>
            ) : (
              <Button
                key={button.callback_data}
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  void send({
                    kind: "button",
                    messageId: props.messageId,
                    value: button.callback_data,
                  }).catch(() => {})
                }
              >
                {button.text}
              </Button>
            ),
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
