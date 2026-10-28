"use client";
import { internationalization } from "@sps/shared-configuration";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const identities = {
    ...props.identitiesRead,
    refetch: props.identitiesRead.refetch || (() => window.location.reload()),
  };
  return (
    <>
      <h2 className="text-xl font-semibold">
        {ru ? "Способы входа" : "Sign-in methods"}
      </h2>
      <p className="mt-3 mb-5 text-sm leading-6 text-muted-foreground">
        {ru
          ? "Выберите, как входить в аккаунт. Управляйте каждым подключённым аккаунтом отдельно."
          : "Choose how you sign in. Manage each connected account separately."}
      </p>
      {identities.isError ? (
        <div role="alert" className="space-y-3 text-sm">
          <p>
            {ru
              ? "Не удалось загрузить способы входа."
              : "Couldn't load your sign-in methods."}
          </p>
          <button
            type="button"
            onClick={() => identities.refetch()}
            className="min-h-11 rounded-xl border border-border px-4 font-semibold"
          >
            {ru ? "Повторить" : "Try again"}
          </button>
        </div>
      ) : identities.isPending ? (
        <div
          role="status"
          aria-label={
            ru ? "Загрузка способов входа" : "Loading sign-in methods"
          }
          className="h-32 animate-pulse rounded-xl bg-muted"
        >
          <span className="sr-only">
            {ru ? "Загрузка способов входа" : "Loading sign-in methods"}
          </span>
        </div>
      ) : (
        identities.data?.map((identity) => (
          <Subject
            language={props.language}
            key={identity.id}
            isServer={false}
            variant="me-identity-id-settings-ai-chat"
            data={props.data}
            identity={identity}
            canRemove={(identities.data?.length || 0) > 1}
          />
        ))
      )}
    </>
  );
}
