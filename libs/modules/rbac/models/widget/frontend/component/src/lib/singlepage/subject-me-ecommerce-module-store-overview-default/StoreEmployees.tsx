"use client";

import type { ICrmWorkspaceEmployee } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Bot, MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useRef, useState, type FormEvent } from "react";
import {
  fieldClass,
  primaryClass,
  secondaryClass,
} from "../subject-me-crm-module-store-workspace/primitives";

interface IStoreEmployeesProps {
  subjectId: string;
  storeId: string;
  language: string;
}

interface IEmployeeRowProps {
  employee: ICrmWorkspaceEmployee;
  language: string;
  pending: boolean;
  error?: string;
  onOpenChat: (id: string) => void;
}

const EmployeeRow = memo(function EmployeeRow({
  employee,
  language,
  pending,
  error,
  onOpenChat,
}: IEmployeeRowProps) {
  const ru = language === "ru";
  const openLabel = ru ? "Открыть чат" : "Open chat";
  return (
    <li className="grid min-w-0 gap-2.5 rounded-lg border border-border p-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
          <Bot aria-hidden="true" className="size-4" />
        </span>
        <p className="min-w-0 flex-1 break-words text-sm font-medium">
          {employee.name}
        </p>
        <button
          type="button"
          aria-label={`${openLabel} · ${employee.name}`}
          className={secondaryClass}
          disabled={pending}
          onClick={() => onOpenChat(employee.id)}
        >
          <MessageSquare aria-hidden="true" className="size-4" />
          {pending ? (ru ? "Открываем чат…" : "Opening chat…") : openLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
});

export function StoreEmployees({
  subjectId,
  storeId,
  language,
}: IStoreEmployeesProps) {
  const ru = language === "ru";
  const router = useRouter();
  const options = api.crmWorkspace.useOptions(subjectId, storeId);
  const create = api.crmWorkspace.useCommand(subjectId);
  const { mutateAsync: open } = api.crmWorkspace.useCommand(subjectId);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [createError, setCreateError] = useState("");
  const [openingEmployeeId, setOpeningEmployeeId] = useState<string | null>(
    null,
  );
  const [openError, setOpenError] = useState<{ id: string; message: string }>();
  const operation = useRef<{ name: string; key: string } | null>(null);
  const openRequest = useRef(0);

  const openChat = useCallback(
    async (id: string) => {
      const request = ++openRequest.current;
      setOpeningEmployeeId(id);
      setOpenError(undefined);
      try {
        const result = await open({
          kind: "open-employee-chat",
          employee: { storeId, subjectId: id },
        });
        if (
          request === openRequest.current &&
          result.kind === "open-employee-chat"
        ) {
          router.push(
            `/${language}/social/chats/${result.data.chatId}/threads/${result.data.threadId}`,
          );
        }
      } catch {
        if (request === openRequest.current) {
          setOpenError({
            id,
            message: ru
              ? "Чат не открылся. Повторите попытку."
              : "Could not open the chat. Try again.",
          });
        }
      } finally {
        if (request === openRequest.current) setOpeningEmployeeId(null);
      }
    },
    [language, open, router, ru, storeId],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const employeeName = name.trim();
    if (!employeeName || create.isPending) return;
    if (operation.current?.name !== employeeName) {
      operation.current = { name: employeeName, key: crypto.randomUUID() };
    }
    setCreated("");
    setCreateError("");
    try {
      await create.mutateAsync({
        kind: "create-employee",
        employee: {
          storeId,
          name: employeeName,
          operationKey: operation.current.key,
        },
      });
      operation.current = null;
      setCreated(employeeName);
      setName("");
      setFormOpen(false);
    } catch {
      setCreateError(
        ru
          ? "Сотрудник не добавился. Повторите попытку."
          : "Could not add the employee. Try again.",
      );
    }
  }

  const status = (options.error as { status?: number } | null)?.status;
  if (status === 401 || status === 403 || !options.data?.canManageEmployees) {
    return null;
  }

  return (
    <section
      id="store-employees"
      className="grid scroll-mt-4 gap-3 rounded-xl border border-border bg-card p-4"
      aria-labelledby="store-employees-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="store-employees-title" className="text-lg font-semibold">
          {ru ? "Сотрудники" : "Employees"}
        </h2>
        <button
          type="button"
          className={secondaryClass}
          aria-expanded={formOpen}
          onClick={() => setFormOpen(!formOpen)}
        >
          {!formOpen && <Plus aria-hidden="true" className="size-4" />}
          {formOpen
            ? ru
              ? "Закрыть форму"
              : "Close form"
            : ru
              ? "Добавить ИИ-сотрудника"
              : "Add AI employee"}
        </button>
      </div>
      {created && (
        <p role="status" className="text-sm">
          {ru
            ? `«${created}» добавлен в магазин.`
            : `“${created}” was added to the store.`}
        </p>
      )}
      {formOpen && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">
            {ru ? "Имя сотрудника" : "Employee name"}
            <input
              className={fieldClass}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              maxLength={120}
              required
            />
          </label>
          <button
            type="submit"
            className={primaryClass}
            disabled={create.isPending || !name.trim()}
          >
            {ru ? "Создать сотрудника" : "Create employee"}
          </button>
          {createError && (
            <p role="alert" className="w-full text-sm text-destructive">
              {createError}
            </p>
          )}
        </form>
      )}
      {options.data.employees.length > 0 ? (
        <ul className="grid gap-2">
          {options.data.employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              language={language}
              pending={openingEmployeeId === employee.id}
              error={
                openError?.id === employee.id ? openError.message : undefined
              }
              onOpenChat={openChat}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {ru
            ? "В магазине пока нет ИИ-сотрудников."
            : "There are no AI employees in this store yet."}
        </p>
      )}
    </section>
  );
}
