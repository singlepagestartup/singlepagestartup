"use client";

import Link from "next/link";
import {
  ClipboardList,
  FileCheck,
  LockKeyhole,
  Package,
  UserRound,
} from "lucide-react";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import type { IOrderFileReview } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import { OrderActions } from "../../../../../../../ecommerce-module/order/create-default/customer-work/OrderActions";
import { PersonalNotes } from "../../../../../../../ecommerce-module/order/create-default/customer-work/PersonalNotes";
import { orderCheckoutAnchor } from "../../../../../../../ecommerce-module/order/list/checkout-default/utils";
import { ResultReview } from "../../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview";
import { StartOrderPayment } from "./OrderPaymentButtons";
import { ThreadContextCard } from "./ThreadContextCard";
import { isChatAccessError } from "../utils";

interface IProps {
  subjectId: string;
  work: ICustomerWorkView;
  productTitle?: string;
  language: string;
}

function useThreadOrder(
  subjectId: string,
  work: ICustomerWorkView,
  enabled = true,
) {
  const orderResult = api.orderWork.read({
    id: subjectId,
    storeId: work.storeId,
    taskId: work.taskId,
    orderId: work.orderId ?? "",
    enabled,
  });
  const loadedOrder = orderResult.data;
  const order =
    enabled &&
    !isChatAccessError(orderResult.error) &&
    loadedOrder?.orderId === work.orderId &&
    loadedOrder?.storeId === work.storeId &&
    loadedOrder?.taskId === work.taskId
      ? loadedOrder
      : undefined;
  return { order, orderResult };
}

export function ThreadOrderStage({
  subjectId,
  work,
  language,
  prompt,
}: IProps & { prompt?: IOrderFileReview }) {
  const { order, orderResult } = useThreadOrder(subjectId, work);
  const step = work.workflow?.orderStep;
  if (!step || !order || orderResult.isError) return null;
  if (prompt)
    return (
      <ResultReview
        subjectId={subjectId}
        work={order}
        language={language}
        prompt={prompt}
        storeTest={Boolean(work.storeTest)}
      />
    );
  const payable =
    step === "ecommerce-module-order-payment" &&
    !work.storeTest &&
    work.status !== "closed" &&
    order.state === "awaiting-payment" &&
    (!order.files?.length ||
      order.files.some(
        (file) =>
          file.id === order.acceptedFileId && !file.invalidatedByCartEdit,
      ));
  if (payable) {
    return work.assignment === "assistant" &&
      !work.workflow?.checkoutPromptId ? (
      <StartOrderPayment
        subjectId={subjectId}
        work={work}
        language={language}
      />
    ) : null;
  }
  return null;
}

export function ThreadCustomerWork(props: IProps) {
  const { subjectId, work, language } = props;
  const ru = language === "ru";
  const { order, orderResult } = useThreadOrder(
    subjectId,
    work,
    !work.workflow?.orderStep,
  );

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
  const summary = work.orderSummary;
  const productSlug = summary?.product.slug ?? work.productSlug;
  const offerId = summary ? summary.offerId : work.offerId;
  const offerSearch = offerId
    ? `?${new URLSearchParams({ offer: offerId })}`
    : "";
  const productHref = productSlug
    ? `/${language}/ecommerce/products/${encodeURIComponent(productSlug)}${offerSearch}`
    : undefined;
  const orderHref =
    work.orderId && productHref
      ? `${productHref}#order-${encodeURIComponent(work.orderId)}`
      : undefined;
  const checkoutHref =
    order && productHref
      ? `${productHref}#${orderCheckoutAnchor(order.orderId)}`
      : undefined;
  const orderProduct =
    orderHref &&
    (summary ? (
      <EcommerceModuleProduct
        isServer={false}
        dataSource="props"
        variant="cart-default"
        data={summary.product}
        language={language}
        productHref={orderHref}
        priceSlot={
          summary.total && (
            <span className="max-w-full wrap-anywhere font-semibold tabular-nums">
              <span className="block text-xs font-medium text-muted-foreground">
                {ru ? "Итого по заказу" : "Order total"}
              </span>
              {new Intl.NumberFormat(language, {
                maximumFractionDigits: summary.total.precision,
              }).format(summary.total.amount)}{" "}
              {summary.total.symbol}
            </span>
          )
        }
      >
        <span className="text-xs text-muted-foreground">
          {ru ? "Количество" : "Quantity"} {summary.quantity}
        </span>
      </EcommerceModuleProduct>
    ) : (
      <Link
        href={orderHref}
        className="inline-flex min-h-11 items-center break-words underline underline-offset-4"
      >
        {props.productTitle || (ru ? "Открыть заказ" : "View order")}
      </Link>
    ));
  const showOrder = Boolean(
    work.orderId ||
    work.productSlug ||
    work.cartProposal ||
    (work.status !== "closed" && work.customerPays),
  );
  const showResult = Boolean(
    order &&
    (order.state !== "awaiting-result" ||
      (order.files?.length ?? 0) > 0 ||
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
        {work.storeTest?.funnelSlug && (
          <Link
            href={`/${language}/ecommerce/stores/${encodeURIComponent(work.storeTest.storeSlug)}/crm/funnels/${encodeURIComponent(work.storeTest.funnelSlug)}?testTask=${encodeURIComponent(work.taskId)}`}
            className="text-sm font-medium underline underline-offset-4"
          >
            {ru ? "Редактировать воронку" : "Edit funnel"}
          </Link>
        )}
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
            productSlot={orderProduct}
            language={language}
          />
        </ThreadContextCard>
      )}
      {order && showResult && (
        <ThreadContextCard
          icon={FileCheck}
          title={ru ? "Результат заказа" : "Order result"}
        >
          <ResultReview
            subjectId={subjectId}
            work={order}
            language={language}
            storeTest={Boolean(work.storeTest)}
            checkoutHref={checkoutHref}
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
        work.canRequestManager ||
        work.awaitingManager) && (
        <ThreadContextCard icon={UserRound} title={ru ? "Менеджер" : "Manager"}>
          {work.awaitingManager ? (
            <p role="status" className="text-sm text-muted-foreground">
              {ru ? "Вы позвали менеджера" : "You asked for a manager"}
            </p>
          ) : work.assignment === "manager" ? (
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
