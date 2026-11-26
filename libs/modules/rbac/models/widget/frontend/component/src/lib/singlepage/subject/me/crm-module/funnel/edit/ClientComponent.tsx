"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { Editor } from "../Editor";
import { FunnelError, StoreScope, type IFunnelStoreScope } from "../StoreScope";
import type { IComponentProps } from "./interface";

interface IClientProps extends Pick<
  IComponentProps,
  "ecommerceModuleStoreSlug" | "crmModuleFunnelSlug"
> {
  widgetId: string;
  language: string;
}

interface IEditFunnelProps extends IFunnelStoreScope {
  crmModuleFunnelSlug: string;
  language: string;
}

function EditFunnel({
  subjectId,
  store,
  crmModuleFunnelSlug,
  language,
}: IEditFunnelProps) {
  const ru = language === "ru";
  const funnel = api.crmWorkspace.useFunnel({
    id: subjectId,
    params: { storeId: store.id, funnelSlug: crmModuleFunnelSlug },
  });
  const options = api.crmWorkspace.useOptions(subjectId, store.id, "editor");
  const command = api.crmWorkspace.useCommand(subjectId);
  const denied =
    hasStatus(funnel.error, 401, 403) || hasStatus(options.error, 401, 403);
  const missing = hasStatus(funnel.error, 404);
  const readFailure = funnel.isError || options.isError;

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
      ) : missing ? (
        <FunnelError
          language={language}
          message={
            ru
              ? "Воронка в этом магазине не найдена."
              : "This funnel could not be found in the store."
          }
        />
      ) : (
        <>
          {readFailure ? (
            <FunnelError
              language={language}
              message={
                ru
                  ? "Не удалось загрузить воронку."
                  : "Could not load the funnel."
              }
              retry={() => {
                if (funnel.isError) void funnel.refetch();
                if (options.isError) void options.refetch();
              }}
            />
          ) : (
            (funnel.isPending || options.isPending) && (
              <p role="status">
                {ru ? "Загружаем воронку…" : "Loading funnel…"}
              </p>
            )
          )}
          {funnel.data && options.data && (
            <>
              <Editor
                subjectId={subjectId}
                key={funnel.data.id}
                storeId={store.id}
                storeSlug={store.slug}
                language={language}
                initial={funnel.data}
                options={options.data}
                execute={command.mutateAsync}
                refresh={funnel.refetch}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStoreSlug,
  crmModuleFunnelSlug,
  language,
}: IClientProps) {
  if (!crmModuleFunnelSlug) {
    return (
      <FunnelError
        language={language}
        message={
          language === "ru" ? "Воронка не указана." : "Funnel not specified."
        }
      />
    );
  }
  return (
    <StoreScope
      widgetId={widgetId}
      ecommerceModuleStoreSlug={ecommerceModuleStoreSlug}
      language={language}
    >
      {(scope) => (
        <EditFunnel
          key={crmModuleFunnelSlug}
          subjectId={scope.subjectId}
          store={scope.store}
          crmModuleFunnelSlug={crmModuleFunnelSlug}
          language={language}
        />
      )}
    </StoreScope>
  );
}
