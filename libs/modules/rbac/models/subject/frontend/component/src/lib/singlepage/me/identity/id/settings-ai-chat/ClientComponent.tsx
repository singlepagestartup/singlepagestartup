"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo, useState } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChangeEmail } from "../../change-email";
import { Component as ChangePassword } from "../../change-password";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const remove = subjectApi.identityDelete({});
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  return (
    <article className="mb-4 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">
        {props.identity.provider === "email_and_password"
          ? ru
            ? "Почта и пароль"
            : "Email & password"
          : props.identity.provider}
      </h3>
      <p className="mt-2 break-words text-sm text-muted-foreground">
        {props.identity.email}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ChangeEmail
          language={props.language}
          data={props.data}
          identity={props.identity}
          isServer={false}
          variant="me-identity-change-email"
          className="contents"
        />
        <ChangePassword
          language={props.language}
          data={props.data}
          identity={props.identity}
          isServer={false}
          variant="me-identity-change-password"
          className="contents"
        />
        <button
          type="button"
          disabled={!props.canRemove || remove.isPending}
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-muted-foreground disabled:opacity-50"
          onClick={() => setConfirm(true)}
        >
          {ru ? "Удалить способ входа" : "Remove identity"}
        </button>
      </div>
      {confirm && (
        <div
          role="alertdialog"
          aria-label={ru ? "Удалить способ входа" : "Remove identity"}
          className="mt-4 border-t border-border pt-4"
        >
          <p className="text-sm">
            {ru
              ? "Удалить этот способ входа из аккаунта?"
              : "Remove this sign-in method from your account?"}
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="min-h-10 rounded-lg border border-border px-4"
            >
              {ru ? "Отмена" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              className="min-h-10 rounded-lg bg-destructive-surface px-4 text-destructive"
              onClick={async () => {
                try {
                  await remove.mutateAsync({
                    id: props.data.id,
                    identityId: props.identity.id,
                  });
                  setConfirm(false);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : ru
                        ? "Не удалось удалить способ входа"
                        : "Identity removal failed",
                  );
                }
              }}
            >
              {ru ? "Удалить способ входа" : "Remove identity"}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </article>
  );
});
