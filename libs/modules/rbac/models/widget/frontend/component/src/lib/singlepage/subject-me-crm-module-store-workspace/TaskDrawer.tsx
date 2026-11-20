import { Select } from "@sps/ui-adapter";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ArrowUpRight, History, X } from "lucide-react";
import { useRef, useState } from "react";
import type {
  ICrmWorkspaceOptions,
  ICrmWorkspaceTaskDetail,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "./Editor/Fields";
import {
  DueDate,
  fieldClass,
  iconButtonClass,
  secondaryClass,
  TaskStatus,
} from "./primitives";
import {
  assigneeOptionGroups,
  evidenceLabels,
  timestampLabel,
} from "./view-model";

export const dialogOverlay = "fixed inset-0 z-50 bg-black/45";

interface ITaskDrawerProps {
  taskId: string;
  detail?: ICrmWorkspaceTaskDetail;
  error?: string;
  href: string;
  language: string;
  options?: ICrmWorkspaceOptions;
  onClose: () => void;
  onRestoreFocus: () => void;
  onNextHistory: (cursor: string) => void;
  onAssign: (
    input: Extract<TCrmWorkspaceCommand, { kind: "assign" }>["assignment"],
  ) => Promise<unknown>;
  onFulfill: (fulfillment: IFulfillmentCommand) => Promise<unknown>;
}

type IFulfillmentCommand = Extract<
  TCrmWorkspaceCommand,
  { kind: "fulfill" }
>["fulfillment"];

const fulfillmentStatus = {
  "awaiting-result": "Готовим результат",
  "awaiting-payment": "Ожидает оплаты",
  paid: "Оплачен",
  preparing: "Собирается",
  "in-transit": "В пути",
  delivered: "Вручён",
};

const orderStatus: Record<string, string> = {
  ...fulfillmentStatus,
  new: "Новый",
  draft: "Готовится",
  open: fulfillmentStatus["awaiting-payment"],
  paying: fulfillmentStatus["awaiting-payment"],
  approving: "Ожидает подтверждения",
  packaging: fulfillmentStatus.preparing,
  delivering: fulfillmentStatus["in-transit"],
  completed: "Завершён",
  expired: "Срок истёк",
  requested_cancelation: "Запрошена отмена",
  canceling: "Отменяется",
  canceled: "Отменён",
  uncollectible: "Не удалось получить оплату",
  void: "Аннулирован",
};

const eventNames: Record<string, string> = {
  opened: "Задача открыта",
  assigned: "Назначение или передача",
  transitioned: "Смена этапа",
  "evidence-recorded": "Записано доказательство",
  "customer-message": "Сообщение клиента",
  "customer-handoff-requested": "Запрошена передача",
  "customer-transferred": "Клиент изменился",
  "customer-budget-approved": "Клиент согласовал бюджет",
  "customer-cart-approved": "Клиент подтвердил товары",
  migrated: "Смена версии",
  "order-attached": "Добавлен заказ",
  closed: "Задача закрыта",
  "reminder-due": "Напоминание",
  "deadline-reached": "Срок истёк",
};

export function TaskDrawer({
  taskId,
  detail,
  error,
  href,
  language,
  options,
  onClose,
  onRestoreFocus,
  onNextHistory,
  onAssign,
  onFulfill,
}: ITaskDrawerProps) {
  const [assignment, setAssignment] = useState("");
  const [pending, setPending] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const assignmentOperation = useRef<{
    assigneeId: string;
    revision: number;
    key: string;
  } | null>(null);
  const task = detail?.task;
  const stages = detail?.publication.definition.stages ?? [];
  const stage = stages.find(({ id }) => id === task?.stageId);
  const participants = options?.participants ?? [];
  const assistant = detail?.assistant;
  const assignees =
    assistant && !participants.some(({ id }) => id === assistant.id)
      ? [...participants, assistant]
      : participants;
  const candidates = assignees.filter(
    ({ id, kind }) => id !== task?.assigneeId && (!task?.test || kind === "ai"),
  );
  const selectedCandidate = candidates.find(({ id }) => id === assignment);
  const name = (id?: string | null) =>
    assignees.find((person) => person.id === id)?.name ?? id;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full min-w-0 max-w-[40rem] flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4 sm:px-6">
            <Dialog.Title className="text-sm font-semibold">
              Задача {taskId.slice(0, 8)}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Закрыть карточку задачи"
              className={iconButtonClass}
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : detail && task ? (
              <article className="grid min-w-0 gap-5 break-words">
                <header className="grid gap-2">
                  <TaskStatus
                    state={
                      task.outcome === "completed" ? "completed" : task.status
                    }
                  />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {task.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {task.customerName} · {detail.publication.name} · Версия{" "}
                    {detail.publication.version}
                  </p>
                </header>
                <dl className="grid gap-4 rounded-xl border border-border bg-muted/45 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Этап</dt>
                    <dd className="font-medium">
                      {stage?.name ?? task.stageId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Исполнитель</dt>
                    <dd>{task.assigneeName ?? "Без исполнителя"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Срок</dt>
                    <dd>
                      <DueDate value={task.deadlineAt ?? undefined} />
                    </dd>
                  </div>
                  {task.expectedEvent && (
                    <div>
                      <dt className="text-muted-foreground">Ожидаем</dt>
                      <dd>{evidenceLabels[task.expectedEvent]}</dd>
                    </div>
                  )}
                </dl>
                {task.status !== "closed" && candidates.length > 0 ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border p-4"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (pending || !selectedCandidate) return;
                      if (
                        assignmentOperation.current?.assigneeId !==
                          assignment ||
                        assignmentOperation.current.revision !== task.revision
                      ) {
                        assignmentOperation.current = {
                          assigneeId: assignment,
                          revision: task.revision,
                          key: crypto.randomUUID(),
                        };
                      }
                      setPending(true);
                      setAssignmentError("");
                      try {
                        await onAssign({
                          storeId: task.storeId,
                          taskId,
                          expectedRevision: task.revision,
                          operationKey: assignmentOperation.current.key,
                          assigneeId: assignment,
                        });
                        assignmentOperation.current = null;
                        setAssignment("");
                      } catch (failure) {
                        setAssignmentError(
                          failure instanceof Error
                            ? failure.message
                            : "Назначение не изменилось.",
                        );
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    <h3 className="font-semibold">
                      {task.assigneeId
                        ? "Передать задачу"
                        : "Назначить исполнителя"}
                    </h3>
                    <Field label="Исполнитель задачи">
                      <Select
                        ui="shadcn"
                        className={fieldClass}
                        value={assignment}
                        onValueChange={setAssignment}
                        placeholder="Выберите исполнителя"
                        disabled={pending}
                        contentClassName="z-[60]"
                        options={assigneeOptionGroups(candidates)}
                      />
                    </Field>
                    {assignmentError && (
                      <p role="alert" className="text-sm text-destructive">
                        {assignmentError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className={`${secondaryClass} w-fit`}
                      disabled={!selectedCandidate || pending}
                    >
                      {pending ? "Назначаем…" : "Назначить"}
                    </button>
                  </form>
                ) : task.status !== "closed" &&
                  !task.assigneeId &&
                  options?.canManageEmployees ? (
                  <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                    Добавьте ИИ-сотрудника в разделе «Сотрудники» магазина,
                    чтобы назначить ему задачу.
                  </p>
                ) : null}
                <section className="grid gap-3 border-t border-border pt-5">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <History aria-hidden="true" className="size-4" /> История и
                    назначения
                  </h3>
                  <ol className="grid gap-2">
                    {detail.history.items.map((entry) => (
                      <li
                        className="grid gap-1 rounded-lg border border-border p-3 text-sm"
                        key={entry.id}
                      >
                        <p className="font-medium">
                          {eventNames[entry.kind] ?? "Событие задачи"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={entry.createdAt}>
                            {timestampLabel(entry.createdAt)}
                          </time>
                          {entry.actorId && ` · ${name(entry.actorId)}`}
                        </p>
                        {entry.detail.stageId && (
                          <p>
                            {stages.find(
                              (stage) => stage.id === entry.detail.stageId,
                            )?.name ?? entry.detail.stageId}
                          </p>
                        )}
                        {entry.detail.assigneeId && (
                          <p>{name(entry.detail.assigneeId)}</p>
                        )}
                        {entry.detail.reason && (
                          <p className="whitespace-pre-line">
                            {entry.detail.reason}
                          </p>
                        )}
                        {entry.detail.evidence && (
                          <p className="whitespace-pre-line rounded-md bg-muted p-2 text-xs">
                            {evidenceLabels[entry.detail.evidence.kind]}
                            {entry.detail.evidence.kind === "manual" &&
                              `\n${entry.detail.evidence.reason}`}
                            {entry.detail.evidence.kind === "message" &&
                              ` · ${entry.detail.evidence.messageId}`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                  {detail.history.nextCursor && (
                    <button
                      type="button"
                      className={`${secondaryClass} w-fit`}
                      onClick={() => onNextHistory(detail.history.nextCursor!)}
                    >
                      Более ранние события
                    </button>
                  )}
                </section>
                {detail.thread && (
                  <section className="grid gap-1 border-t border-border pt-5">
                    <h3 className="font-semibold">Тред</h3>
                    {detail.thread.chatId ? (
                      <Link
                        href={`/${language}/social/chats/${detail.thread.chatId}/threads/${detail.thread.id}`}
                        className={`${secondaryClass} w-fit`}
                      >
                        Открыть тестовый чат
                      </Link>
                    ) : (
                      <p className="text-sm">{detail.thread.title}</p>
                    )}
                  </section>
                )}
                {detail.order && (
                  <section className="grid gap-1 border-t border-border pt-5">
                    <h3 className="font-semibold">Заказ</h3>
                    <p className="text-sm">{detail.order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {detail.order.fulfillment
                        ? fulfillmentStatus[detail.order.fulfillment.state]
                        : (detail.order.paymentStatus &&
                            orderStatus[detail.order.paymentStatus]) ||
                          orderStatus[detail.order.status] ||
                          "Статус неизвестен"}
                    </p>
                    {detail.order.fulfillment?.trackingNumber && (
                      <p className="text-sm">
                        Трек-номер {detail.order.fulfillment.trackingNumber}
                      </p>
                    )}
                    {detail.order.fulfillment?.canFulfill && (
                      <FulfillmentForm
                        key={detail.order.fulfillment.state}
                        order={detail.order}
                        task={task}
                        onFulfill={onFulfill}
                      />
                    )}
                  </section>
                )}
                {detail.costs && (
                  <section className="grid gap-3 border-t border-border pt-5">
                    <h3 className="font-semibold">Расходы и переводы</h3>
                    {detail.costs.length ? (
                      <ul className="grid gap-2">
                        {detail.costs.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-lg border border-border p-3 text-sm"
                          >
                            <p className="font-medium">
                              {item.title} · {item.amount}
                            </p>
                            <p className="text-muted-foreground">
                              {item.status}
                            </p>
                            {item.transfer && <p>{item.transfer}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Расходов пока нет.
                      </p>
                    )}
                  </section>
                )}
                <a
                  href={href}
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть прямую ссылку{" "}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              </article>
            ) : (
              <p role="status" className="text-sm text-muted-foreground">
                Загружаем задачу…
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FulfillmentForm({
  order,
  task,
  onFulfill,
}: {
  order: NonNullable<ICrmWorkspaceTaskDetail["order"]>;
  task: ICrmWorkspaceTaskDetail["task"];
  onFulfill: ITaskDrawerProps["onFulfill"];
}) {
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<{ value: string; key: string } | null>(null);
  let stage: IFulfillmentCommand["stage"];
  let label: string;
  let field: string | undefined;
  switch (order.fulfillment?.state) {
    case "paid":
      stage = "preparing";
      label = "Начать сборку";
      break;
    case "preparing":
      stage = "in-transit";
      label = "Передать в доставку";
      field = "Трек-номер";
      break;
    case "in-transit":
      stage = "delivered";
      label = "Подтвердить вручение";
      field = "Номер подтверждения перевозчика";
      break;
    default:
      return null;
  }
  const value = reference.trim();
  return (
    <form
      className="mt-2 grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || (field && !value)) return;
        if (!operation.current || operation.current.value !== value) {
          operation.current = { value, key: crypto.randomUUID() };
        }
        setPending(true);
        setError("");
        try {
          await onFulfill({
            orderId: order.id,
            storeId: task.storeId,
            taskId: task.id,
            stage,
            operationKey: operation.current.key,
            ...(stage === "in-transit" ? { trackingNumber: value } : {}),
            ...(stage === "delivered" ? { carrierEvidenceId: value } : {}),
          });
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Не удалось сохранить этап доставки.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      {field && (
        <Field label={field}>
          <input
            className={fieldClass}
            value={reference}
            maxLength={180}
            onChange={(event) => setReference(event.currentTarget.value)}
            required
          />
        </Field>
      )}
      <button
        className={`${secondaryClass} w-fit`}
        disabled={pending || (!!field && !value)}
      >
        {label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
