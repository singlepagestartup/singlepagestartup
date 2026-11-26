import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import type {
  ICrmWorkspaceStore,
  TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model";
import { Component as WidgetsToEcommerceModuleWidgets } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component";
import {
  ContactRound,
  Kanban,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { StoreCatalogNav } from "./products/StoreCatalogNav";
import { storeSectionHref, type TStoreSection } from "./paths";

interface IStoreHeaderProps {
  widgetId: string;
  language: string;
  storeId: string;
  storeSlug: string;
  ecommerceModuleStore?: IEcommerceModuleStore;
  section: TStoreSection;
  directory?: TStoreCatalogDirectoryKind;
  access?: Pick<ICrmWorkspaceStore, "canManageCatalog" | "canManageTasks">;
}

export function StoreHeader({
  widgetId,
  language,
  storeId,
  storeSlug,
  ecommerceModuleStore,
  section,
  directory,
  access,
}: IStoreHeaderProps) {
  const ru = language === "ru";
  const links = [
    {
      section: "overview",
      label: ru ? "Обзор" : "Overview",
      Icon: LayoutDashboard,
      show: Boolean(
        access && (access.canManageCatalog || access.canManageTasks !== false),
      ),
    },
    {
      section: "products",
      label: ru ? "Товары" : "Products",
      Icon: Package,
      show: true,
    },
    {
      section: "orders",
      label: ru ? "Заказы" : "Orders",
      Icon: ShoppingBag,
      show: access?.canManageTasks === true,
    },
    {
      section: "customers",
      label: ru ? "Клиенты" : "Customers",
      Icon: ContactRound,
      show: access?.canManageTasks === true,
    },
    {
      section: "employees",
      label: ru ? "Сотрудники" : "Employees",
      Icon: Users,
      show: Boolean(access && access.canManageTasks !== false),
    },
    {
      section: "tasks",
      label: ru ? "Задачи" : "Tasks",
      Icon: Kanban,
      show: Boolean(access),
    },
    {
      section: "funnels",
      label: ru ? "Воронки" : "Funnels",
      Icon: Workflow,
      show: Boolean(access && access.canManageTasks !== false),
    },
    {
      section: "settings",
      label: ru ? "Настройки" : "Settings",
      Icon: Settings,
      show: access?.canManageCatalog,
    },
  ] as const;

  return (
    <WidgetsToEcommerceModuleWidgets
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [{ column: "widgetId", method: "eq", value: widgetId }],
          },
        },
      }}
    >
      {({ data }) =>
        data?.map((relation) => (
          <WidgetsToEcommerceModuleWidgets
            key={relation.id}
            isServer={false}
            variant="default"
            dataSource="props"
            data={relation}
            language={language}
            ecommerceModuleStoreId={storeId}
            ecommerceModuleStore={ecommerceModuleStore}
          >
            <nav
              aria-label={ru ? "Разделы магазина" : "Store sections"}
              className="flex min-w-0 flex-wrap gap-x-3 border-t border-border px-4 sm:gap-x-5 sm:px-6"
            >
              {links
                .filter(({ show }) => show)
                .map(({ section: target, label, Icon }) => (
                  <Link
                    key={target}
                    href={storeSectionHref(language, storeSlug, target)}
                    aria-current={section === target ? "page" : undefined}
                    className="inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring aria-[current=page]:border-primary aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {label}
                  </Link>
                ))}
            </nav>
            {section === "products" && access && (
              <StoreCatalogNav
                language={language}
                storeSlug={storeSlug}
                directory={directory}
              />
            )}
          </WidgetsToEcommerceModuleWidgets>
        ))
      }
    </WidgetsToEcommerceModuleWidgets>
  );
}
