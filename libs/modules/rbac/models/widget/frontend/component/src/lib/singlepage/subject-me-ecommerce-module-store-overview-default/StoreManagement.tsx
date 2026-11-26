"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { ArrowUpRight, Kanban, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  secondaryClass,
  storeList,
} from "../subject-me-crm-module-store-workspace/primitives";
import {
  hasStatus,
  taskHref,
} from "../subject-me-crm-module-store-workspace/view-model";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../subject/me/ecommerce-module/store/StoreSection";
import { StoreSectionStatus } from "../subject/me/ecommerce-module/store/StoreSectionStatus";
import { storeSectionHref } from "../subject/me/ecommerce-module/store/paths";

const metrics = [
  {
    section: "products",
    count: "productCount",
    ru: "Товары",
    en: "Products",
    Icon: Package,
    color: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  },
  {
    section: "orders",
    count: "orderCount",
    ru: "Заказы",
    en: "Orders",
    Icon: ShoppingBag,
    color:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  },
  {
    section: "tasks",
    count: "taskCount",
    ru: "Задачи",
    en: "Tasks",
    Icon: Kanban,
    color: "bg-primary/25 text-foreground",
  },
] as const;

interface IStoreCountsProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
}

function StoreCounts({
  subjectId,
  storeId,
  storeSlug,
  language,
}: IStoreCountsProps) {
  const ru = language === "ru";
  const overview = api.crmWorkspace.useOverview({
    id: subjectId,
    params: { storeId },
  });
  if (overview.isError) {
    const denied = hasStatus(overview.error, 401, 403);
    return (
      <div className={storeList.panel}>
        <p role="alert">
          {denied
            ? ru
              ? "У вас нет доступа к обзору магазина."
              : "You do not have access to this store overview."
            : ru
              ? "Не удалось загрузить показатели магазина."
              : "Could not load store totals."}
        </p>
        {!denied && (
          <button
            type="button"
            className={`${secondaryClass} w-fit`}
            onClick={() => void overview.refetch()}
          >
            {ru ? "Повторить" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label={ru ? "Показатели магазина" : "Store totals"}
      aria-busy={overview.isPending}
      className="grid min-w-0 gap-3 sm:grid-cols-3 sm:gap-4"
    >
      {metrics.map(({ section, count, ru: labelRu, en, Icon, color }) => (
        <Link
          key={section}
          href={storeSectionHref(language, storeSlug, section)}
          className={`${storeList.row} grid gap-5 p-5 sm:gap-6 sm:p-6`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${color}`}
            >
              <Icon aria-hidden="true" className="size-[18px]" />
            </span>
            <span className="flex-1 text-sm font-semibold">
              {ru ? labelRu : en}
            </span>
            <ArrowUpRight aria-hidden="true" className={storeList.arrow} />
          </span>
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {overview.data
              ? overview.data[count].toLocaleString(language)
              : "—"}
          </span>
        </Link>
      ))}
    </section>
  );
}

export function StoreManagement({
  widgetId,
  ecommerceModuleStore,
  language,
}: IStoreSectionContentProps) {
  const router = useRouter();
  const storeSlug = ecommerceModuleStore.slug;

  useEffect(() => {
    const { hash, search } = window.location;
    const query = new URLSearchParams(search);
    const taskId = query.get("task");
    const boardHref = storeSectionHref(language, storeSlug, "tasks");
    let destination: string | undefined;

    if (taskId) {
      query.delete("task");
      destination = taskHref(language, storeSlug, taskId);
    } else if (query.get("edit") === "1" && query.has("funnel")) {
      destination = boardHref;
    } else if (hash === "#store-products") {
      destination = storeSectionHref(language, storeSlug, "products");
    } else if (hash === "#store-employees") {
      destination = storeSectionHref(language, storeSlug, "employees");
    } else if (
      hash === "#store-workspace" ||
      [
        "version",
        "funnel",
        "testTask",
        "assignee",
        "status",
        "search",
        "view",
      ].some((key) => query.has(key))
    ) {
      destination = boardHref;
    }

    if (destination) {
      const params = query.toString();
      router.replace(params ? `${destination}?${params}` : destination);
    }
  }, [language, router, storeSlug]);

  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="overview"
    >
      {(session) =>
        session.access ? (
          <StoreCounts
            subjectId={session.access.subjectId}
            storeId={ecommerceModuleStore.id}
            storeSlug={storeSlug}
            language={language}
          />
        ) : (
          <div className={storeList.panel}>
            <StoreSectionStatus
              language={language}
              session={session}
              deniedMessage={
                language === "ru"
                  ? "У вас нет доступа к обзору магазина."
                  : "You do not have access to this store overview."
              }
            />
          </div>
        )
      }
    </StoreSection>
  );
}
