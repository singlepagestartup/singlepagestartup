"use client";

import Link from "next/link";
import type { Ref } from "react";
import { ClipboardList, Package, Paperclip } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { OrderActions } from "../../../../../../../ecommerce-module/order/create-default/customer-work/OrderActions";
import { PersonalNotes } from "../../../../../../../ecommerce-module/order/create-default/customer-work/PersonalNotes";
import { ResultReview } from "../../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview";

interface IProps {
  subjectId: string;
  threadId: string;
  language: string;
  resultSectionRef: Ref<HTMLElement>;
  selectedVersionId?: string;
  onVersionSelect: (id: string) => void;
}

export function ThreadCustomerWork(props: IProps) {
  const { subjectId, threadId, language } = props;
  const ru = language === "ru";
  const workResult = api.customerWorkForThread({ id: subjectId, threadId });
  const work = workResult.isError ? undefined : workResult.data;
  const orderResult = api.orderWork.read({
    id: subjectId,
    storeId: work?.storeId ?? "",
    taskId: work?.taskId ?? "",
    orderId: work?.orderId ?? "",
  });
  const order = orderResult.isError ? undefined : orderResult.data;

  if (workResult.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {ru
          ? "Не удалось загрузить данные задачи."
          : "Could not load task details."}
      </p>
    );
  }
  if (!work) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {ru ? "Загружаем данные задачи…" : "Loading task details…"}
      </p>
    );
  }

  const status = {
    active: ru ? "В работе" : "In progress",
    waiting: ru ? "Ожидает действия" : "Waiting",
    closed: ru ? "Закрыта" : "Closed",
  }[work.status];
  const assignment = {
    assistant: ru ? "Ассистент" : "Assistant",
    manager: ru ? "Менеджер" : "Manager",
    unassigned: ru ? "Не назначен" : "Unassigned",
  }[work.assignment];
  const orderHref =
    work.orderId && work.productSlug
      ? `/${language}/ecommerce/products/${encodeURIComponent(work.productSlug)}#order-${encodeURIComponent(work.orderId)}`
      : undefined;
  const orderLink = orderHref ? (
    <Link
      href={orderHref}
      className="min-h-9 content-center justify-self-start rounded-md text-sm underline underline-offset-4"
    >
      {ru ? "Открыть заказ" : "View order"}
    </Link>
  ) : null;
  const awaitingPayment = order?.state === "awaiting-payment";

  return (
    <>
      <section className="grid min-w-0 gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
          {ru ? "Задача" : "Task"}
        </h4>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl border border-border bg-card p-3 text-sm">
          <dt className="text-muted-foreground">{ru ? "Статус" : "Status"}</dt>
          <dd>{status}</dd>
          {work.workflow && (
            <>
              <dt className="text-muted-foreground">
                {ru ? "Воронка" : "Funnel"}
              </dt>
              <dd className="break-words">{work.workflow.title}</dd>
              <dt className="text-muted-foreground">{ru ? "Этап" : "Stage"}</dt>
              <dd className="break-words">{work.workflow.stageTitle}</dd>
            </>
          )}
          <dt className="text-muted-foreground">
            {ru ? "Исполнитель" : "Assignee"}
          </dt>
          <dd className="break-words">{work.operator || assignment}</dd>
        </dl>
      </section>
      <section className="grid min-w-0 gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4 shrink-0" aria-hidden="true" />
          {work.orderId
            ? ru
              ? "Заказ"
              : "Order"
            : ru
              ? "Консультация"
              : "Consultation"}
        </h4>
        {!awaitingPayment && orderLink}
        <OrderActions subjectId={subjectId} work={work} language={language} />
      </section>
      {work.orderId && (
        <section
          ref={props.resultSectionRef}
          tabIndex={-1}
          className="grid min-w-0 gap-3"
        >
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Paperclip className="size-4 shrink-0" aria-hidden="true" />
            {ru ? "Результат заказа" : "Order result"}
          </h4>
          {order && (
            <ResultReview
              subjectId={subjectId}
              work={order}
              language={language}
              selectedVersionId={props.selectedVersionId}
              onVersionSelect={props.onVersionSelect}
            />
          )}
          {awaitingPayment && orderLink}
          {orderResult.isError && (
            <p role="alert" className="text-sm text-destructive">
              {ru
                ? "Не удалось загрузить результат заказа."
                : "Could not load the order result."}
            </p>
          )}
          {orderResult.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              {ru ? "Загружаем результат заказа…" : "Loading the order result…"}
            </p>
          )}
        </section>
      )}
      {work.memory && (
        <section className="grid min-w-0 gap-3">
          <h4 className="text-sm font-semibold">
            {ru ? "Знания" : "Knowledge"}
          </h4>
          <PersonalNotes
            subjectId={subjectId}
            work={work}
            memory={work.memory}
            language={language}
          />
        </section>
      )}
    </>
  );
}
