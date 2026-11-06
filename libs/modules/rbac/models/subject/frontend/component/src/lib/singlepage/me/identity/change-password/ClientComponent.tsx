"use client";
import { internationalization } from "@sps/shared-configuration";

import { memo, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { Icon } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const update = api.identityUpdate({});
  const buttonClass =
    "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

  function close() {
    setOpen(false);
    setError("");
    setCurrentPassword("");
    setPassword("");
    setRepeat("");
    trigger.current?.focus();
  }

  return (
    <div
      className={props.className}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      data-subject-id={props.data.id}
      data-identity-id={props.identity.id}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={update.isPending}
        className={`${buttonClass} border border-border bg-card hover:bg-muted`}
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            setNotice("");
          }
        }}
      >
        {ru ? "Изменить пароль" : "Change password"}
      </button>
      {open && (
        <section
          id={id}
          aria-label={ru ? "Изменить пароль" : "Change password"}
          className="order-last mt-5 min-w-0 basis-full rounded-xl border border-border bg-muted p-4 sm:p-5"
        >
          <h4 className="text-base font-semibold">
            {ru ? "Изменить пароль" : "Change password"}
          </h4>
          <form
            className="mt-5 grid min-w-0 max-w-xl gap-4"
            onChangeCapture={() => setError("")}
            onSubmit={async (event) => {
              event.preventDefault();
              if (update.isPending) return;
              if (password !== repeat) {
                setError(
                  ru
                    ? "Новые пароли не совпадают."
                    : "The new passwords do not match.",
                );
                return;
              }
              if (password === currentPassword) {
                setError(
                  ru
                    ? "Выберите пароль, который отличается от текущего."
                    : "Choose a password different from your current one.",
                );
                return;
              }
              setError("");
              try {
                await update.mutateAsync({
                  id: props.data.id,
                  identityId: props.identity.id,
                  data: { password: currentPassword, newPassword: password },
                });
                close();
                setNotice(ru ? "Пароль обновлён." : "Password updated.");
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : ru
                      ? "Не удалось изменить пароль."
                      : "The password could not be updated.",
                );
              }
            }}
          >
            <PasswordField
              label={ru ? "Текущий пароль" : "Current password"}
              name="current-password"
              autoComplete="current-password"
              autoFocus
              required
              disabled={update.isPending}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <PasswordField
              label={ru ? "Новый пароль" : "New password"}
              name="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              hint={ru ? "Не менее 8 символов." : "Use at least 8 characters."}
              disabled={update.isPending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordField
              label={ru ? "Повторите новый пароль" : "Repeat new password"}
              name="repeat-password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={update.isPending}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="rounded-xl border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={update.isPending}
                className={`${buttonClass} bg-primary text-primary-foreground hover:brightness-95 focus-visible:brightness-95`}
              >
                {update.isPending
                  ? ru
                    ? "Обновляем…"
                    : "Updating…"
                  : ru
                    ? "Изменить пароль"
                    : "Change password"}
              </button>
              <button
                type="button"
                disabled={update.isPending}
                onClick={close}
                className={`${buttonClass} border border-border bg-card hover:bg-muted`}
              >
                {ru ? "Отмена" : "Cancel"}
              </button>
            </div>
          </form>
        </section>
      )}
      {notice && (
        <p
          role="status"
          className="order-last mt-3 basis-full text-sm text-muted-foreground"
        >
          {notice}
        </p>
      )}
    </div>
  );
});

interface IPasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}
function PasswordField({ label, hint, ...props }: IPasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-describedby={
            props["aria-describedby"] || (hint ? `${id}-hint` : undefined)
          }
          className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 pr-14 text-base text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-card disabled:opacity-60 aria-invalid:border-destructive"
        />
        <button
          type="button"
          disabled={props.disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute right-1 top-0.5 grid size-11 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Icon name={visible ? "eye-slash" : "eye"} />
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
