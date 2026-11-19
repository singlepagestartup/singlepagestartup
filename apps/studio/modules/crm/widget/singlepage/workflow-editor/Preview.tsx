import {
  ChevronDown,
  CircleCheck,
  Clock3,
  FlaskConical,
  MoveRight,
} from "lucide-react";
import { useState } from "react";
import { fieldClass } from "../../../shared/workflow-ui";
import {
  workflowEventLabels,
  type WorkflowStage,
} from "../../../shared/workflows";
import { Field } from "./Fields";

interface PreviewProps {
  stage: WorkflowStage;
  nextStage?: WorkflowStage;
}

export function Preview({ stage, nextStage }: PreviewProps) {
  const [example, setExample] = useState("missing");
  const waitLabel = workflowEventLabels[stage.waitFor];
  const waits = stage.waitFor !== "none";
  const offersCheckout = stage.operations.includes("checkout");
  const needsPayment = stage.waitFor === "payment-confirmed";
  const isTransition = example === "evidence" || example === "payment";

  const examples = {
    missing: {
      title: waits ? `Ожидаем событие «${waitLabel}»` : "Нужны данные",
      text: stage.missingData || "Запишите действие при нехватке данных.",
      Icon: Clock3,
    },
    revision: {
      title: "Нужна правка",
      text: stage.operations.includes("request-revision")
        ? "Исполнитель уточняет правку. Задача остаётся на этом этапе."
        : "Операция запроса правки недоступна. Задача остаётся на этом этапе.",
      Icon: Clock3,
    },
    evidence: {
      title: needsPayment
        ? "Ожидаем подтверждение платежа"
        : (nextStage?.title ?? "Условия этапа выполнены"),
      text: needsPayment
        ? "Оплату подтверждает платёжный домен. Задача ждёт это событие."
        : offersCheckout
          ? "Клиент указал версию превью. Можно предложить оплату заказа."
          : stage.evidence ||
            "Запишите, какое доказательство нужно для перехода.",
      Icon: needsPayment ? Clock3 : CircleCheck,
    },
    payment: {
      title: needsPayment
        ? (nextStage?.title ?? "Платёж подтверждён")
        : waits
          ? `Ожидаем событие «${waitLabel}»`
          : "Текущий этап",
      text: needsPayment
        ? "Платёжный домен подтвердил оплату. Можно продолжить исполнение заказа."
        : "Для перехода нужны условия выбранного этапа.",
      Icon: needsPayment ? CircleCheck : Clock3,
    },
    timeout: {
      title: !waits
        ? "Этап без срока ожидания"
        : stage.silenceOutcome === "completed"
          ? "Проверить наличие результата"
          : "Закрыто без результата",
      text: waits
        ? `Срок ожидания ${stage.waitHours} ч истёк. История содержит последний этап и причину исхода.`
        : "Для предпросмотра таймера выберите событие и срок ожидания.",
      Icon: Clock3,
    },
  };
  const outcome = examples[example as keyof typeof examples];

  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <FlaskConical
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        Предпросмотр этапа
        <ChevronDown
          aria-hidden="true"
          className="ms-auto size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="grid gap-4 border-t border-border p-4">
        <Field label="Пример события">
          <select
            className={fieldClass}
            value={example}
            onChange={(event) => setExample(event.currentTarget.value)}
          >
            <option value="missing">Данных пока недостаточно</option>
            <option value="revision">Клиент просит правку</option>
            <option value="evidence">Получено доказательство этапа</option>
            <option value="payment">Платёжный домен подтвердил оплату</option>
            <option value="timeout">Истёк срок ожидания</option>
          </select>
        </Field>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-muted px-2.5 py-1.5 font-medium">
            {stage.title || "Новый этап"}
          </span>
          {isTransition && (
            <MoveRight
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          )}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-medium">
            <outcome.Icon aria-hidden="true" className="size-4" />{" "}
            {outcome.title}
          </span>
        </div>
        <p
          className="text-sm leading-6 text-muted-foreground"
          aria-live="polite"
        >
          {outcome.text}
        </p>
      </div>
    </details>
  );
}
