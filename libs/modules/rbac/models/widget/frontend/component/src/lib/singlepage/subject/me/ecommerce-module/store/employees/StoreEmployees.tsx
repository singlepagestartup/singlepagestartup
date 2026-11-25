"use client";

import type { ICrmWorkspaceEmployeeListItem } from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn/button";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { getLocalizedProfilePlainText } from "@sps/social/models/profile/sdk/model/src/lib/plain-text";
import { ChevronRight, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import {
  primaryClass,
  storeList,
} from "../../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeEmployeeHref } from "../paths";

interface IStoreEmployeesProps {
  canManageEmployees: boolean;
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
}

interface IEmployeeRowProps {
  employee: ICrmWorkspaceEmployeeListItem;
  href: string;
  language: string;
}

const employeeColumns =
  "sm:grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1fr)_1rem]";

const EmployeeRow = memo(function EmployeeRow({
  employee,
  href,
  language,
}: IEmployeeRowProps) {
  const { profile } = employee;
  const title =
    getLocalizedProfilePlainText(profile?.title, language) || employee.name;
  const subtitle = getLocalizedProfilePlainText(profile?.subtitle, language);
  const detailsId = `store-employee-profile-${employee.id}`;
  const variantId = `store-employee-variant-${employee.id}`;
  const descriptionIds = [
    (subtitle || profile?.slug) && detailsId,
    profile?.variant && variantId,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <li>
      <Link
        href={href}
        aria-label={title}
        aria-describedby={descriptionIds || undefined}
        className={`${storeList.row} ${employeeColumns} grid grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-x-3 px-4 py-3`}
      >
        <span className="grid size-10 place-items-center rounded-xl bg-muted">
          <UserRound aria-hidden="true" className="size-5" />
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="wrap-anywhere text-sm font-semibold">{title}</span>
          {(subtitle || profile?.slug) && (
            <span
              id={detailsId}
              className="grid min-w-0 gap-1 text-sm text-muted-foreground"
            >
              {subtitle && <span className="wrap-anywhere">{subtitle}</span>}
              {profile?.slug && (
                <span className="wrap-anywhere text-xs">{profile.slug}</span>
              )}
            </span>
          )}
        </span>
        {profile?.variant && (
          <span
            id={variantId}
            className="col-start-2 row-start-2 mt-1 min-w-0 wrap-anywhere text-xs text-muted-foreground sm:col-start-3 sm:row-start-1 sm:mt-0 sm:text-sm"
          >
            <span className="sm:sr-only">
              {language === "ru" ? "Вариант профиля" : "Profile variant"}{" "}
            </span>
            {profile.variant}
          </span>
        )}
        <ChevronRight
          aria-hidden="true"
          className={`${storeList.arrow} col-start-3 row-start-1 sm:col-start-4`}
        />
      </Link>
    </li>
  );
});

export function StoreEmployees({
  canManageEmployees,
  subjectId,
  storeId,
  storeSlug,
  language,
}: IStoreEmployeesProps) {
  const ru = language === "ru";

  function useEmployeesPage({ offset, limit, search }: IStoreTableParams) {
    const result = api.crmWorkspace.useEmployees({
      id: subjectId,
      params: { storeId, offset, limit, ...(search && { search }) },
    });
    return { ...result, denied: hasStatus(result.error, 401, 403) };
  }

  return (
    <StoreManagementTable
      isServer={false}
      language={language}
      title={ru ? "Сотрудники" : "Employees"}
      searchPlaceholder={ru ? "Имя или адрес профиля" : "Name or profile slug"}
      emptyMessage={
        ru ? "Сотрудников пока нет." : "There are no employees yet."
      }
      deniedMessage={
        ru
          ? "У вас нет доступа к сотрудникам этого магазина."
          : "You do not have access to this store’s employees."
      }
      usePage={useEmployeesPage}
      action={
        canManageEmployees && (
          <Button asChild className={primaryClass}>
            <Link href={storeEmployeeHref(language, storeSlug, "new")}>
              <Plus aria-hidden="true" className="size-4" />
              {ru ? "Добавить сотрудника" : "Add employee"}
            </Link>
          </Button>
        )
      }
      header={
        <div
          aria-hidden="true"
          className={`${employeeColumns} grid items-center gap-x-3 px-4 text-xs font-medium text-muted-foreground max-sm:[&>span:not(:first-child)]:hidden`}
        >
          <span className="col-span-2">{ru ? "Сотрудник" : "Employee"}</span>
          <span>{ru ? "Вариант профиля" : "Profile variant"}</span>
        </div>
      }
      renderRow={(employee: ICrmWorkspaceEmployeeListItem) => (
        <EmployeeRow
          key={employee.id}
          employee={employee}
          href={storeEmployeeHref(language, storeSlug, employee.id)}
          language={language}
        />
      )}
    />
  );
}
