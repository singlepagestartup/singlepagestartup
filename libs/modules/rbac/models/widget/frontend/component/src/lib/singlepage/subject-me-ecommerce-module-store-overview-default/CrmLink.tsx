"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import Link from "next/link";
import { Workflow } from "lucide-react";

interface IStoreCrmLink {
  storeId: string;
  storeSlug: string;
  language: string;
}

interface IOwnedStoreCrmLink extends IStoreCrmLink {
  subjectId: string;
}

function OwnedStoreCrmLink({
  storeId,
  storeSlug,
  language,
  subjectId,
}: IOwnedStoreCrmLink) {
  const result = api.crmWorkspace.useStores(subjectId);
  if (result.isError || !result.data?.some((store) => store.id === storeId))
    return null;

  return (
    <Link
      href={`/${language}/ecommerce/stores/${encodeURIComponent(storeSlug)}/crm`}
      className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Workflow aria-hidden="true" className="size-4" />{" "}
      {language === "ru" ? "Задачи магазина" : "Store tasks"}
    </Link>
  );
}

export function StoreCrmLink({ storeId, storeSlug, language }: IStoreCrmLink) {
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={null}
    >
      {({ data, authenticated }) =>
        authenticated && data ? (
          <OwnedStoreCrmLink
            subjectId={data.id}
            storeId={storeId}
            storeSlug={storeSlug}
            language={language}
          />
        ) : null
      }
    </Subject>
  );
}
