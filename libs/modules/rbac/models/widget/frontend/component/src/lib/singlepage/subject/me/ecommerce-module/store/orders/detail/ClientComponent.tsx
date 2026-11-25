"use client";

import { OrderContents } from "./OrderContents";
import { OrderStatusBadge } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/store-list-row/OrderStatusBadge";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceStore } from "@sps/rbac/models/subject/sdk/model";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shared-ui-shadcn";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TaskForStore } from "../../../../crm-module/task/detail/ClientComponent";
import {
  hasStatus,
  taskHref,
} from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import {
  storeList,
  secondaryClass,
} from "../../../../../../subject-me-crm-module-store-workspace/primitives";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { storeCustomerHref } from "../../paths";
import { localizedText } from "../../products/view-model";

interface IOrderProps {
  store: ICrmWorkspaceStore;
  orderId: string;
  subjectId: string;
  language: string;
}

function OrderDetail({ store, orderId, subjectId, language }: IOrderProps) {
  const ru = language === "ru";
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedTaskId = params?.get("task");
  function selectTask(taskId: string) {
    const next = new URLSearchParams(params?.toString());
    next.set("task", taskId);
    next.delete("thread");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  const reading = api.crmWorkspace.useOrder({
    id: subjectId,
    params: { storeId: store.id, orderId },
  });
  const order = reading.data;
  if (hasStatus(reading.error, 401, 403, 404)) {
    return (
      <p role="alert">
        {ru
          ? "Заказ недоступен в этом магазине."
          : "This order is unavailable in this store."}
      </p>
    );
  }
  if (!order) {
    if (reading.isError)
      return (
        <div className={storeList.panel}>
          <p role="alert">
            {ru ? "Не удалось загрузить заказ." : "Could not load the order."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => void reading.refetch()}
          >
            {ru ? "Повторить" : "Retry"}
          </Button>
        </div>
      );
    return <p role="status">{ru ? "Загружаем заказ…" : "Loading order…"}</p>;
  }
  const selected =
    order.tasks.find((task) => task.id === selectedTaskId) ?? order.tasks[0];
  return (
    <>
      <section
        className={storeList.panel}
        id={`crm-order-${order.id}`}
        aria-labelledby="store-order-title"
      >
        <header className={storeList.heading}>
          <h1 id="store-order-title" className={`${storeList.title} break-all`}>
            {ru ? "Заказ" : "Order"} {order.id}
          </h1>
          <OrderStatusBadge status={order.status} language={language} />
        </header>
        <dl className="grid gap-5 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div className="grid content-start gap-1">
            <dt className="text-muted-foreground">
              {ru ? "Дата заказа" : "Order date"}
            </dt>
            <dd>
              <time dateTime={order.createdAt}>
                {new Intl.DateTimeFormat(language, {
                  dateStyle: "long",
                  timeZone: "UTC",
                }).format(new Date(order.createdAt))}
              </time>
            </dd>
          </div>
          <div className="grid content-start gap-1">
            <dt className="text-muted-foreground">
              {ru ? "Клиент" : "Customer"}
            </dt>
            {order.customers.length ? (
              order.customers.map((customer) => (
                <dd
                  key={customer.subjectId}
                  className="grid gap-0.5 break-words"
                >
                  <Link
                    href={storeCustomerHref(
                      language,
                      store.slug,
                      customer.subjectId,
                    )}
                    className="w-fit font-semibold underline underline-offset-4 hover:text-muted-foreground"
                  >
                    {localizedText(customer.profile?.title ?? null, language) ||
                      customer.name}
                  </Link>
                  {customer.profile && (
                    <span className="text-muted-foreground">
                      @{customer.profile.slug}
                    </span>
                  )}
                  {localizedText(customer.profile?.subtitle ?? null, language)}
                </dd>
              ))
            ) : (
              <dd>{ru ? "Клиент не указан." : "No customer linked."}</dd>
            )}
          </div>
        </dl>
        <OrderContents
          subjectId={subjectId}
          orderId={order.id}
          storeId={store.id}
          order={order}
          language={language}
          storeSlug={store.slug}
        />
      </section>
      <section className={storeList.panel} aria-labelledby="order-tasks-title">
        <div className={storeList.heading}>
          <h2 id="order-tasks-title" className="text-xl font-semibold">
            {ru ? "Задачи заказа" : "Order tasks"}
          </h2>
          {order.tasks.length > 1 && selected && (
            <Select value={selected.id} onValueChange={selectTask}>
              <SelectTrigger
                aria-label={ru ? "Выбрать задачу" : "Select a task"}
                className="w-full sm:w-auto"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {order.tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.label} · {task.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selected ? (
          <div className="grid min-w-0 gap-4">
            <Link
              href={taskHref(language, store.slug, selected.id)}
              id={`crm-task-${selected.id}`}
              className={`${secondaryClass} w-fit`}
            >
              {selected.label}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <TaskForStore
              key={selected.id}
              taskId={selected.id}
              orderId={order.id}
              subjectId={subjectId}
              store={store}
              language={language}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ru
              ? "К заказу пока не привязаны задачи."
              : "No tasks are linked to this order yet."}
          </p>
        )}
      </section>
    </>
  );
}
export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  ecommerceModuleOrderId,
  language,
}: IStoreSectionContentProps & { ecommerceModuleOrderId: string }) {
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="orders"
    >
      {(session) =>
        session.access?.store.canManageTasks ? (
          <OrderDetail
            key={`${session.access.subjectId}:${ecommerceModuleStore.id}:${ecommerceModuleOrderId}`}
            store={session.access.store}
            orderId={ecommerceModuleOrderId}
            subjectId={session.access.subjectId}
            language={language}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={
              language === "ru"
                ? "У вас нет доступа к заказам этого магазина."
                : "You do not have access to this store's orders."
            }
          />
        )
      }
    </StoreSection>
  );
}
