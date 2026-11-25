"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Workspace } from "./Workspace";
import { Stores } from "./Stores";

interface IClientProps {
  widgetId: string;
  ecommerceModuleStoreSlug?: string;
  language: string;
}

export function Component({
  widgetId,
  ecommerceModuleStoreSlug,
  language,
}: IClientProps) {
  const fallback = (
    <p className="rounded-lg border border-border bg-card p-5 text-sm">
      {language === "ru"
        ? ecommerceModuleStoreSlug
          ? "Войдите в аккаунт, чтобы открыть задачи магазина."
          : "Войдите в аккаунт, чтобы посмотреть свои магазины."
        : ecommerceModuleStoreSlug
          ? "Sign in to view store tasks."
          : "Sign in to view your stores."}
    </p>
  );

  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={fallback}
    >
      {({ data, authenticated }) =>
        data && authenticated && ecommerceModuleStoreSlug ? (
          <Workspace
            widgetId={widgetId}
            key={`${data.id}:${ecommerceModuleStoreSlug}`}
            subjectId={data.id}
            storeSlug={ecommerceModuleStoreSlug}
            language={language}
          />
        ) : data && authenticated ? (
          <Stores key={data.id} subjectId={data.id} language={language} />
        ) : (
          fallback
        )
      }
    </Subject>
  );
}
