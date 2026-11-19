"use client";

import Link from "next/link";
import type { Ref } from "react";
import {
  ClipboardList,
  FileCheck,
  LockKeyhole,
  Package,
  UserRound,
} from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { OrderActions } from "../../../../../../../ecommerce-module/order/create-default/customer-work/OrderActions";
import { PersonalNotes } from "../../../../../../../ecommerce-module/order/create-default/customer-work/PersonalNotes";
import { ResultReview } from "../../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview";
import { ThreadContextCard } from "./ThreadContextCard";
import { isChatAccessError } from "../utils";

interface IProps {
  subjectId: string;
  work: ICustomerWorkView;
  productTitle?: string;
  language: string;
  resultSectionRef: Ref<HTMLElement>;
  selectedVersionId?: string;
  onVersionSelect: (id: string) => void;
}

export function ThreadCustomerWork(props: IProps) {
  const { subjectId, work, language } = props;
  const ru = language === "ru";
  const orderResult = api.orderWork.read({
    id: subjectId,
    storeId: work.storeId,
    taskId: work.taskId,
    orderId: work.orderId ?? "",
  });
  const order = isChatAccessError(orderResult.error)
    ? undefined
    : orderResult.data;

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
  const showOrder = Boolean(
    work.orderId ||
    work.productSlug ||
    work.cartProposal ||
    (work.status !== "closed" && work.customerPays),
  );
  const showResult = Boolean(
    order &&
    (order.state !== "awaiting-result" ||
      order.versions.length > 0 ||
      order.result ||
      order.receipt ||
      order.trackingNumber ||
      order.expertArchive),
  );

  return (
    <>
      <ThreadContextCard icon={ClipboardList} title={ru ? "Задача" : "Task"}>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
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
      </ThreadContextCard>
      {showOrder && (
        <ThreadContextCard
          icon={Package}
          title={
            work.orderId
              ? ru
                ? "Заказ"
                : "Order"
              : ru
                ? "Предложение"
                : "Offer"
          }
        >
          <OrderActions
            subjectId={subjectId}
            work={work}
            productTitle={props.productTitle}
            language={language}
          />
          {orderHref && (
            <Link
              href={orderHref}
              className="min-h-9 content-center justify-self-start rounded-md text-sm underline underline-offset-4"
            >
              {ru ? "Открыть заказ" : "View order"}
            </Link>
          )}
        </ThreadContextCard>
      )}
      {order && showResult && (
        <ThreadContextCard
          icon={FileCheck}
          title={ru ? "Результат заказа" : "Order result"}
          sectionRef={props.resultSectionRef}
        >
          <ResultReview
            subjectId={subjectId}
            work={order}
            language={language}
            selectedVersionId={props.selectedVersionId}
            onVersionSelect={props.onVersionSelect}
          />
        </ThreadContextCard>
      )}
      {work.orderId &&
        orderResult.isError &&
        !isChatAccessError(orderResult.error) && (
          <p role="alert" className="text-sm text-destructive">
            {ru
              ? "Не удалось загрузить результат заказа."
              : "Could not load the order result."}
          </p>
        )}
      {(work.assignment === "manager" ||
        (work.assignment === "assistant" && work.status !== "closed")) && (
        <ThreadContextCard icon={UserRound} title={ru ? "Менеджер" : "Manager"}>
          {work.assignment === "manager" ? (
            <p className="break-words text-sm">
              {work.operator ||
                (ru ? "Менеджер подключён." : "A manager has joined.")}
            </p>
          ) : (
            <OrderActions
              subjectId={subjectId}
              work={work}
              language={language}
              managerOnly
            />
          )}
        </ThreadContextCard>
      )}
      {work.memory && (
        <ThreadContextCard
          icon={LockKeyhole}
          title={ru ? "Личные заметки" : "Private notes"}
        >
          <PersonalNotes
            subjectId={subjectId}
            work={work}
            memory={work.memory}
            language={language}
          />
        </ThreadContextCard>
      )}
    </>
  );
}
