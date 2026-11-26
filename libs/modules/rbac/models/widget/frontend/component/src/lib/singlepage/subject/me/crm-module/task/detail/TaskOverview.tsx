import { stageWorkFunding } from "@sps/crm/models/funnel/sdk/model";
import {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_WORK_MODELS,
  providerModelDisplayName,
} from "@sps/shared-utils";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { orderDisplayStatus } from "@sps/ecommerce/models/order/sdk/model";
import { OrderStatusBadge } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/store-list-row/OrderStatusBadge";
import Link from "next/link";

import { useRef, useState, type ReactNode } from "react";
import type {
  ICrmWorkspaceTaskDetail,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "../../../../../subject-me-crm-module-store-workspace/Fields";
import {
  storeProductHref,
  storeOrderHref,
  storeCustomerHref,
} from "../../../ecommerce-module/store/paths";
import {
  DueDate,
  TaskStatus,
} from "../../../../../subject-me-crm-module-store-workspace/primitives";
import { evidenceLabels } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { TaskAssignee } from "./TaskAssignee";

interface ITaskOverviewProps {
  detail: ICrmWorkspaceTaskDetail;
  storeSlug: string;
  thread: ReactNode;
  moveAction?: ReactNode;
  commandPending?: boolean;
  language: string;
  onAssign: (
    input: Extract<TCrmWorkspaceCommand, { kind: "assign" }>["assignment"],
  ) => Promise<unknown>;
  onFulfill: (fulfillment: IFulfillmentCommand) => Promise<unknown>;
}

type IFulfillmentCommand = Extract<
  TCrmWorkspaceCommand,
  { kind: "fulfill" }
>["fulfillment"];

type TStageState =
  | "pending"
  | "required"
  | "finished"
  | "current"
  | "visited"
  | "unvisited"
  | "completed"
  | "closed";

const stageStates: Record<
  TStageState,
  { label: [string, string]; bar: string }
> = {
  pending: {
    label: ["Ожидает начала", "Pending"],
    bar: "bg-muted-foreground/20",
  },
  required: {
    label: ["Ожидает выполнения", "Required"],
    bar: "bg-muted-foreground/35",
  },
  finished: {
    label: ["Этап пройден", "Stage completed"],
    bar: "bg-emerald-600",
  },
  current: {
    label: ["Текущий этап", "Current stage"],
    bar: "bg-primary",
  },
  visited: {
    label: ["Задача была на этапе", "Stage visited"],
    bar: "bg-primary/65",
  },
  unvisited: {
    label: ["Задача не была на этапе", "Stage not visited"],
    bar: "bg-muted-foreground/20",
  },
  completed: {
    label: ["Завершена на этом этапе", "Completed at this stage"],
    bar: "bg-emerald-600",
  },
  closed: {
    label: ["Закрыта на этом этапе", "Closed at this stage"],
    bar: "bg-muted-foreground",
  },
};

function StageProgress({
  detail,
  language,
  moveAction,
}: Pick<ITaskOverviewProps, "detail" | "language" | "moveAction">) {
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const { task } = detail;
  const ru = language === "ru";
  const copyIndex = ru ? 0 : 1;
  const recorded = (detail.history?.items ?? []).filter(
    ({ kind, revision }) =>
      revision <= task.revision &&
      (kind === "opened" || kind === "transitioned" || kind === "migrated"),
  );
  const visited = new Set(
    detail.visitedStageIds ??
      recorded.flatMap(({ detail }) => [
        detail.previousStageId,
        detail.stageId,
      ]),
  );
  const stages = (detail.funnel.definition.stages ?? [])
    .filter((stage) =>
      detail.stageStates
        ? Object.hasOwn(detail.stageStates, stage.id) &&
          (task.status === "closed" ||
            !stage.archived ||
            detail.stageStates[stage.id] !== "pending")
        : !stage.archived || stage.id === task.stageId || visited.has(stage.id),
    )
    .map((stage, index) => {
      let state: TStageState = visited.has(stage.id) ? "visited" : "unvisited";
      if (stage.id === task.stageId) {
        state = "current";
        if (task.status === "closed") {
          state = task.outcome === "completed" ? "completed" : "closed";
        }
      }
      const persisted = detail.stageStates?.[stage.id];
      if (persisted) {
        state =
          persisted === "completed" &&
          (task.status !== "closed" || task.stageId !== stage.id)
            ? "finished"
            : persisted;
      }
      return { ...stage, state, position: index + 1 };
    });
  const shown =
    stages.find(({ id }) => id === (hovered ?? focused ?? selected)) ??
    stages.find(({ id }) => id === task.stageId);

  return (
    <div className="grid min-w-0 gap-1 border-t border-border/70 pt-3">
      {stages.length > 0 && (
        <ol
          aria-label={ru ? "Этапы воронки" : "Funnel stages"}
          className="flex min-w-0 gap-1.5 overflow-x-auto px-0.5 py-0.5"
        >
          {stages.map((stage) => {
            const style = stageStates[stage.state];
            const active = stage.id === task.stageId;
            return (
              <li className="min-w-6 flex-1" key={stage.id}>
                <button
                  type="button"
                  aria-label={`${stage.name} · ${style.label[copyIndex]}`}
                  aria-current={active ? "step" : undefined}
                  className="flex h-7 w-full items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  onFocus={() => setFocused(stage.id)}
                  onBlur={() => setFocused(undefined)}
                  onMouseEnter={() => setHovered(stage.id)}
                  onMouseLeave={() => setHovered(undefined)}
                  onClick={() => setSelected(stage.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setHovered(undefined);
                      setSelected(undefined);
                      setFocused(undefined);
                    }
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-full rounded-full ${style.bar}`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
          {shown ? (
            <>
              <span className="text-muted-foreground">
                {ru
                  ? `Этап ${shown.position} из ${stages.length}`
                  : `Stage ${shown.position} of ${stages.length}`}{" "}
                ·
              </span>
              <span className="break-words font-semibold">{shown.name}</span>
              {shown.state !== "current" && (
                <span className="text-xs text-muted-foreground">
                  {stageStates[shown.state].label[copyIndex]}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              {ru ? "Этап недоступен" : "Stage unavailable"}
            </span>
          )}
        </p>
        {moveAction}
      </div>
    </div>
  );
}

export function TaskOverview({
  detail,
  storeSlug,
  moveAction,
  commandPending,
  thread,
  language,
  onAssign,
  onFulfill,
}: ITaskOverviewProps) {
  const { task } = detail;
  const ru = language === "ru";

  const stage = detail.funnel.definition.stages.find(
    (entry) => entry.id === task.stageId,
  );
  let modelId = stage?.provider?.modelId;
  if (
    !modelId &&
    stage &&
    task.assigneeKind === "ai" &&
    stageWorkFunding(detail.funnel.definition, stage)?.payer === "store-owner"
  ) {
    modelId =
      stage.output === "image"
        ? OPEN_AI_WORK_MODELS.image[0]
        : OPEN_AI_STAGE_TEXT_DEFAULT.modelId;
  }

  return (
    <article className="@container grid min-w-0 gap-4 break-words">
      <header
        id={`crm-task-${task.id}`}
        tabIndex={-1}
        className="grid min-w-0 scroll-mt-4 gap-4 rounded-2xl border border-l-4 border-border border-l-primary bg-card p-4 sm:p-5"
      >
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {detail.funnel.name}
            </p>
            <TaskStatus
              state={task.outcome === "completed" ? "completed" : task.status}
            />
          </div>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {task.label}
          </h1>
        </div>
        <StageProgress
          detail={detail}
          language={language}
          moveAction={moveAction}
        />
        <div className="grid min-w-0 gap-4 border-t border-border pt-4 md:grid-cols-2">
          <section
            className="grid min-w-0 content-start gap-3"
            aria-label={ru ? "Детали задачи" : "Task details"}
          >
            <dl className="grid min-w-0 gap-3 text-sm">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">
                  {ru ? "Клиент" : "Customer"}
                </dt>
                <dd className="font-medium">
                  {detail.canManageTasks && task.customerId ? (
                    <Link
                      className="underline underline-offset-4"
                      href={storeCustomerHref(
                        language,
                        storeSlug,
                        task.customerId,
                      )}
                    >
                      {task.customerName}
                    </Link>
                  ) : (
                    task.customerName
                  )}
                </dd>
              </div>
              {modelId && (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {stage?.provider
                      ? ru
                        ? "Модель этапа"
                        : "Stage model"
                      : ru
                        ? "Модель по умолчанию"
                        : "Default model"}
                  </dt>
                  <dd className="font-medium">
                    {providerModelDisplayName(modelId)}
                  </dd>
                </div>
              )}
              {task.productId && (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {ru ? "Товар" : "Product"}
                  </dt>
                  <dd className="min-w-0">
                    <Link
                      className="font-medium underline underline-offset-4"
                      href={storeProductHref(
                        language,
                        storeSlug,
                        task.productId,
                      )}
                    >
                      {task.label}
                    </Link>
                  </dd>
                </div>
              )}
              {task.deadlineAt && (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {ru ? "Срок" : "Due"}
                  </dt>
                  <dd>
                    <DueDate value={task.deadlineAt} />
                  </dd>
                </div>
              )}
              {task.expectedEvent && (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {ru ? "Ожидаем" : "Waiting for"}
                  </dt>
                  <dd>{evidenceLabels[task.expectedEvent]}</dd>
                </div>
              )}
              {detail.order && (
                <OrderSection
                  order={detail.order}
                  task={task}
                  href={
                    detail.canManageTasks
                      ? storeOrderHref(language, storeSlug, detail.order.id)
                      : undefined
                  }
                  language={language}
                  onFulfill={onFulfill}
                />
              )}
            </dl>
          </section>
          <TaskAssignee
            detail={detail}
            language={language}
            storeSlug={storeSlug}
            commandPending={commandPending}
            onAssign={onAssign}
          />
        </div>
      </header>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        {thread}
      </div>
    </article>
  );
}

interface IOrderSectionProps {
  href?: string;
  order: NonNullable<ICrmWorkspaceTaskDetail["order"]>;
  task: ICrmWorkspaceTaskDetail["task"];
  language: string;
  onFulfill: ITaskOverviewProps["onFulfill"];
}

function OrderSection({
  href,
  order,
  task,
  language,
  onFulfill,
}: IOrderSectionProps) {
  const ru = language === "ru";

  return (
    <div
      id={`crm-order-${order.id}`}
      className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"
    >
      <dt className="text-muted-foreground">{ru ? "Заказ" : "Order"}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-2">
        {href ? (
          <Link
            className="break-all font-medium underline underline-offset-4"
            href={href}
          >
            {order.id}
          </Link>
        ) : (
          <span className="break-all">{order.id}</span>
        )}
        <OrderStatusBadge
          status={orderDisplayStatus(order.status, order.workState)}
          language={language}
        />
        {order.fulfillment?.trackingNumber && (
          <p className="text-sm">
            {ru ? "Трек-номер" : "Tracking number"}{" "}
            {order.fulfillment.trackingNumber}
          </p>
        )}
        {order.fulfillment?.canFulfill && (
          <FulfillmentForm
            key={order.fulfillment.state}
            order={order}
            task={task}
            language={language}
            onFulfill={onFulfill}
          />
        )}
      </dd>
    </div>
  );
}

function FulfillmentForm({
  order,
  task,
  language,
  onFulfill,
}: IOrderSectionProps) {
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<{ value: string; key: string } | null>(null);
  const ru = language === "ru";
  let stage: IFulfillmentCommand["stage"];
  let label: string;
  let field: string | undefined;
  switch (order.fulfillment?.state) {
    case "paid":
      stage = "preparing";
      label = ru ? "Начать сборку" : "Start preparing";
      break;
    case "preparing":
      stage = "in-transit";
      label = ru ? "Передать в доставку" : "Mark as shipped";
      field = ru ? "Трек-номер" : "Tracking number";
      break;
    case "in-transit":
      stage = "delivered";
      label = ru ? "Подтвердить вручение" : "Confirm delivery";
      field = ru
        ? "Номер подтверждения перевозчика"
        : "Carrier confirmation number";
      break;
    default:
      return null;
  }
  const value = reference.trim();
  return (
    <form
      className="grid gap-2 border-t border-border pt-3"
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
              : ru
                ? "Не удалось обновить статус доставки."
                : "Could not update the delivery status.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      {field && (
        <Field label={field}>
          <input
            className={settingsFormStyles.field}
            value={reference}
            maxLength={180}
            onChange={(event) => setReference(event.currentTarget.value)}
            required
          />
        </Field>
      )}
      <button
        className={`${settingsFormStyles.secondary} w-fit`}
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
