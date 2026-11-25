"use client";

import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { storeEmployeeHref } from "../../paths";

interface IEmployeeFormProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
}

export function EmployeeForm({
  subjectId,
  storeId,
  storeSlug,
  language,
}: IEmployeeFormProps) {
  const ru = language === "ru";
  const router = useRouter();
  const create = api.crmWorkspace.useCommand(subjectId);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const operation = useRef<{ name: string; key: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const employeeName = name.trim();
    if (!employeeName || create.isPending) return;
    if (operation.current?.name !== employeeName) {
      operation.current = { name: employeeName, key: crypto.randomUUID() };
    }
    setError("");
    try {
      const result = await create.mutateAsync({
        kind: "create-employee",
        employee: {
          storeId,
          name: employeeName,
          operationKey: operation.current.key,
        },
      });
      if (result.kind === "create-employee") {
        router.push(storeEmployeeHref(language, storeSlug, result.data.id));
      }
    } catch {
      setError(
        ru
          ? "Не удалось создать сотрудника. Повторите попытку."
          : "Could not create the employee. Try again.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className={settingsFormStyles.label}>
        {ru ? "Имя сотрудника" : "Employee name"}
        <input
          className={settingsFormStyles.field}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          maxLength={120}
          required
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        className={`${settingsFormStyles.primary} justify-self-end`}
        disabled={create.isPending || !name.trim()}
      >
        {ru ? "Создать сотрудника" : "Create employee"}
      </button>
    </form>
  );
}
