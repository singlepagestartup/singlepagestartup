"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { useRouter } from "next/navigation";
import {
  funnelEditHref,
  hasStatus,
} from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { Editor } from "../Editor";
import { FunnelError, StoreScope, type IFunnelStoreScope } from "../StoreScope";
import type { IComponentProps } from "./interface";

interface IClientProps extends Pick<
  IComponentProps,
  "ecommerceModuleStoreSlug"
> {
  widgetId: string;
  language: string;
}

interface ICreateFunnelProps extends IFunnelStoreScope {
  language: string;
}

function CreateFunnel({ subjectId, store, language }: ICreateFunnelProps) {
  const router = useRouter();
  const ru = language === "ru";
  const options = api.crmWorkspace.useOptions(subjectId, store.id, "editor");
  const command = api.crmWorkspace.useCommand(subjectId);
  const denied = hasStatus(options.error, 401, 403);

  return (
    <>
      {denied ? (
        <FunnelError
          language={language}
          message={
            ru
              ? "Нет доступа к воронкам этого магазина."
              : "You do not have access to this store's funnels."
          }
        />
      ) : (
        <>
          {options.isPending && (
            <p role="status">
              {ru ? "Загружаем настройки воронки…" : "Loading funnel settings…"}
            </p>
          )}
          {options.isError && (
            <FunnelError
              language={language}
              message={
                ru
                  ? "Не удалось загрузить настройки воронки."
                  : "Could not load funnel settings."
              }
              retry={() => void options.refetch()}
            />
          )}
          {options.data && (
            <Editor
              subjectId={subjectId}
              storeId={store.id}
              storeSlug={store.slug}
              language={language}
              options={options.data}
              execute={command.mutateAsync}
              onCreated={(funnel) =>
                router.replace(
                  funnelEditHref(language, store.slug, funnel.slug),
                )
              }
            />
          )}
        </>
      )}
    </>
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStoreSlug,
  language,
}: IClientProps) {
  return (
    <StoreScope
      widgetId={widgetId}
      ecommerceModuleStoreSlug={ecommerceModuleStoreSlug}
      language={language}
    >
      {(scope) => (
        <CreateFunnel
          subjectId={scope.subjectId}
          store={scope.store}
          language={language}
        />
      )}
    </StoreScope>
  );
}
