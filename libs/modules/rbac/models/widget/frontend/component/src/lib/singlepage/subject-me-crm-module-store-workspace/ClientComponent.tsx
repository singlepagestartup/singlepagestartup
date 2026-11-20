"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Workspace } from "./Workspace";
import { Stores } from "./Stores";

interface IClientProps {
  ecommerceModuleStoreSlug?: string;
  crmModuleTaskId?: string;
  language: string;
}

export function Component({
  ecommerceModuleStoreSlug,
  crmModuleTaskId,
  language,
}: IClientProps) {
  const fallback = (
    <p className="rounded-lg border border-border bg-card p-5 text-sm">
      Войдите в аккаунт, чтобы открыть задачи магазина.
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
            key={`${data.id}:${ecommerceModuleStoreSlug ?? ""}:${crmModuleTaskId ?? ""}`}
            subjectId={data.id}
            storeSlug={ecommerceModuleStoreSlug}
            initialTaskId={crmModuleTaskId}
            language={language}
          />
        ) : data && authenticated ? (
          <Stores subjectId={data.id} language={language} />
        ) : (
          fallback
        )
      }
    </Subject>
  );
}
