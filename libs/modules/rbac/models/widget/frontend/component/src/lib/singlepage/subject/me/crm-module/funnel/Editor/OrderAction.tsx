import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import {
  orderPaymentStagePatch,
  type IFunnelStage,
  type TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import { Field } from "../../../../../subject-me-crm-module-store-workspace/Fields";

interface IOrderActionProps {
  stage: IFunnelStage;
  kind: TFunnelKind;
  language: string;
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function OrderAction({
  stage,
  kind,
  language,
  onChange,
}: IOrderActionProps) {
  const ru = language === "ru";
  const workTokens = stage.resultPricing?.kind === "work-tokens";
  const action = stage.actions.find(
    (item) =>
      item.actors.includes("system") &&
      item.evidence.some((evidence) =>
        ["payment", "result-accepted", "delivery"].includes(evidence),
      ),
  );
  const payment =
    stage.behavior === "ecommerce-module-order-payment" ||
    action?.evidence.includes("payment");
  const acceptance = action?.evidence.includes("result-accepted");
  const delivery =
    kind === "physical-order" && action?.evidence.includes("delivery");
  const selected = payment
    ? "payment"
    : acceptance
      ? "accept"
      : delivery
        ? "delivery"
        : "none";
  return (
    <>
      <Field
        label={ru ? "Действие с заказом" : "Order action"}
        hint={
          workTokens
            ? ru
              ? "Это последний этап. После приёмки PDF задача завершится, и покупатель получит оригинал."
              : "This is the final stage. Accepting the PDF closes the task and releases the original to the customer."
            : payment
              ? ru
                ? "Клиент оплачивает заказ в чате. Платёжный сервис проверяет сумму и подтверждает оплату."
                : "The customer pays in the order chat. The payment service verifies the amount and confirms the payment."
              : acceptance
                ? ru
                  ? "Покупатель проверяет файл. Если он принимает результат, задача переходит дальше. Если нужны правки, комментарий получает исполнитель этого этапа."
                  : "The customer reviews the file. Accepting the result advances the task. A request for changes sends the customer's comment to the employee on this stage."
                : undefined
        }
      >
        <Select
          ui="shadcn"
          className={settingsFormStyles.field}
          value={selected}
          onValueChange={(value) => {
            if (value === selected) {
              return;
            }
            if (value === "payment") {
              onChange({ ...orderPaymentStagePatch(stage), actions: [] });
              return;
            }
            onChange({
              behavior: undefined,
              actions:
                value === "accept"
                  ? [
                      {
                        id: "accept-result",
                        name: ru ? "Принять результат" : "Accept result",
                        actors: ["system"],
                        evidence: ["result-accepted"],
                      },
                    ]
                  : [],
              ...(stage.waiting &&
                stage.waiting.expectedEvent !== "message" &&
                !(
                  value === "accept" &&
                  stage.waiting.expectedEvent === "result-accepted"
                ) && {
                  waiting: undefined,
                }),
            });
          }}
          disabled={stage.archived || workTokens}
          options={[
            {
              value: "none",
              label: ru ? "Без действия с заказом" : "No order action",
            },
            {
              value: "payment",
              label: ru ? "Отправить заказ на оплату" : "Request order payment",
            },
            ...(kind === "individual-service"
              ? [
                  {
                    value: "accept",
                    label: ru
                      ? "Согласовать результат с покупателем"
                      : "Request customer review of the result",
                  },
                ]
              : []),
            ...(delivery
              ? [
                  {
                    value: "delivery",
                    label: ru
                      ? "Подтверждение доставки"
                      : "Delivery confirmation",
                  },
                ]
              : []),
          ]}
        />
      </Field>
      {stage.resultPricing?.kind === "confirmed-cost" && (
        <p className="text-sm text-muted-foreground">
          {ru
            ? "После сохранения воронки стоимость нового результата определяется по цене предложения. Сумма принятого заказа указана в его карточке."
            : "After saving the funnel, new results use the offer price. The accepted amount is shown in the order details."}
        </p>
      )}
    </>
  );
}
