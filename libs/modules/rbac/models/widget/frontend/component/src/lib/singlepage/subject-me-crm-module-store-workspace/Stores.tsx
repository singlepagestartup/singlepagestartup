"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { ArrowRight, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fieldClass, primaryClass } from "./primitives";
import { storeHref } from "./view-model";

interface IStoresProps {
  language: string;
  subjectId: string;
}

export function Stores({ language, subjectId }: IStoresProps) {
  const ru = language === "ru";
  const router = useRouter();
  const stores = api.crmWorkspace.useStores(subjectId);
  const create = api.ecommerceModuleCatalogMutation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = name.trim();
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
      await stores.refetch();
      router.push(storeHref(language, String(store.slug)));
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
    <section className="grid gap-5">
      <h1 className="text-3xl font-semibold tracking-tight">
        {ru ? "Мои магазины" : "My stores"}
      </h1>
      <form
        onSubmit={submit}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
        <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">
          {ru ? "Название магазина" : "Store name"}
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            maxLength={180}
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className={primaryClass}
        >
          <Plus aria-hidden="true" className="size-4" />
          {ru ? "Создать магазин" : "Create store"}
        </button>
        {error && (
          <p role="alert" className="w-full text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
      {stores.isPending && (
        <p role="status">{ru ? "Загружаем магазины…" : "Loading stores…"}</p>
      )}
      {stores.isError && (
        <p role="alert">
          {ru ? "Не удалось загрузить магазины." : "Could not load stores."}
        </p>
      )}
      {stores.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {ru
            ? "Здесь появятся ваши магазины."
            : "Your stores will appear here."}
        </p>
      )}
      {Boolean(stores.data?.length) && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stores.data?.map((store) => (
            <li key={store.id}>
              <Link
                href={storeHref(language, store.slug)}
                className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-semibold hover:bg-muted"
              >
                <Store
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 flex-1 break-words">
                  {store.title}
                </span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
