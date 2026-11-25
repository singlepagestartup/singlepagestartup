"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { workspaceHref } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeSectionHref } from "../paths";

function StoreForm({
  subjectId,
  language,
}: {
  subjectId: string;
  language: string;
}) {
  const router = useRouter();
  const create = subjectApi.ecommerceModuleCatalogMutation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const ru = language === "ru";
  const title = name.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title || create.isPending) return;
    setError("");
    try {
      const store = await create.mutateAsync({
        id: subjectId,
        data: {
          method: "POST",
          entity: "stores",
          data: { title: { [language]: title }, adminTitle: title },
        },
      });
      router.push(storeSectionHref(language, String(store.slug), "settings"));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : ru
            ? "Не удалось создать магазин."
            : "Could not create the store.",
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="create-store-title"
      className={settingsFormStyles.panel}
    >
      <h1
        id="create-store-title"
        className="mb-5 text-2xl font-semibold tracking-tight"
      >
        {ru ? "Создать магазин" : "Create store"}
      </h1>
      <label className={settingsFormStyles.label}>
        {ru ? "Название магазина" : "Store name"}
        <input
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
          maxLength={180}
          className={settingsFormStyles.field}
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className={settingsFormStyles.actions}>
        <Link
          href={workspaceHref(language)}
          className={settingsFormStyles.secondary}
        >
          {ru ? "Отмена" : "Cancel"}
        </Link>
        <button
          type="submit"
          disabled={create.isPending || !title}
          className={settingsFormStyles.primary}
        >
          {ru ? "Создать магазин" : "Create store"}
        </button>
      </div>
    </form>
  );
}

export function ClientComponent({ language }: { language: string }) {
  const fallback = (
    <p className={settingsFormStyles.panel}>
      {language === "ru"
        ? "Войдите в аккаунт, чтобы создать магазин."
        : "Sign in to create a store."}
    </p>
  );
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={fallback}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <StoreForm key={data.id} subjectId={data.id} language={language} />
        ) : (
          fallback
        )
      }
    </Subject>
  );
}
