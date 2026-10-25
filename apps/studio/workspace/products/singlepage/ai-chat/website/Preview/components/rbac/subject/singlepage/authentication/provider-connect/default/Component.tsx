"use client";
import { type InputHTMLAttributes as InputHTMLAttributes } from "react";
import { useId as useIdPresentation } from "react";
import { useState as useStatePresentation } from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { useId, useState } from "react";
import { getIdentityProviderMeta } from "../../../../../shared";
interface ITextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
function PasswordField({
  label,
  hint,
  error,
  id: suppliedId,
  ...props
}: ITextFieldProps) {
  const generatedId = useIdPresentation();
  const id = suppliedId ?? generatedId;
  const [visible, setVisible] = useStatePresentation(false);
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kitPresentation.label}`}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={`${kitPresentation.field} pr-14`}
        />
        <ButtonPresentation
          variant="plain"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Скрыть" : "Показать"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute top-0.5 right-1 min-h-11 w-11 px-2"
        >
          <Icon name={visible ? "eye-slash" : "eye"} />
        </ButtonPresentation>
      </div>
      {hint ? (
        <p
          id={`${id}-hint`}
          className={`text-xs leading-relaxed ${kitPresentation.muted}`}
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-[color:var(--workspace-brand-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IProviderConnectProps {
  provider?: string;
  account?: string;
  onComplete?: (account: string) => void;
  onCancel?: () => void;
}
export function Component({
  provider = "oauth_google",
  account = "",
  onComplete,
  onCancel,
}: IProviderConnectProps = {}) {
  const meta = getIdentityProviderMeta(provider);
  const credentials = meta.kind === "credentials";
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const wallet = provider === "ethereum_virtual_machine";
  const [stage, setStage] = useState<"account" | "approve" | "complete">(
    "account",
  );
  const [value, setValue] = useState(account);
  const id = useId();
  return (
    <section
      className="mt-5 min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-background)] p-4 sm:p-5"
      aria-label={`Connect ${meta.title}`}
      data-ds-block="rbac.subject.authentication-provider-connect-default"
    >
      <h4 className="font-semibold">Подключить {meta.title}</h4>
      <p className="mt-2 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
        {credentials
          ? "Укажите почту и пароль, затем подтвердите адрес."
          : wallet
            ? "Выберите кошелёк и подтвердите владение подписью. Платёж не требуется."
            : `Продолжите через ${meta.title}, затем подтвердите вход.`}
      </p>
      <p className="mt-2 text-xs text-[color:var(--workspace-brand-muted)]">
        Предварительный просмотр. Внешний аккаунт и кошелёк не подключаются.
      </p>
      {stage === "account" ? (
        <form
          className="mt-5 grid min-w-0 max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setStage("approve");
          }}
        >
          <label
            className="grid min-w-0 gap-2 text-sm font-medium"
            htmlFor={id}
          >
            {wallet
              ? "Адрес кошелька"
              : provider === "telegram"
                ? "Имя пользователя Telegram"
                : "Почта аккаунта"}
            <input
              autoFocus
              id={id}
              type={
                provider === "oauth_google" || credentials ? "email" : "text"
              }
              required
              className={kit.field}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              pattern={wallet ? "0x[a-fA-F0-9]{40}" : undefined}
              placeholder={
                wallet
                  ? "0x…"
                  : provider === "telegram"
                    ? "@username"
                    : "you@example.com"
              }
            />
          </label>
          {credentials && (
            <PasswordField
              label="Пароль"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              {credentials
                ? "Отправить код"
                : wallet
                  ? "Продолжить с кошельком"
                  : `Продолжить через ${meta.title}`}
            </Button>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </form>
      ) : stage === "approve" && credentials ? (
        <form
          className="mt-5 grid min-w-0 max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code !== "123456") {
              setError("Код неверный. В этом примере используйте 123456.");
              return;
            }
            onComplete?.(value.trim().toLowerCase());
            setPassword("");
            setCode("");
            setStage("complete");
          }}
        >
          <p className="break-all text-sm">Verify {value}</p>
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            Код подтверждения
            <input
              autoFocus
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              className={kit.field}
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
            />
          </label>
          <p className="text-xs text-[color:var(--workspace-brand-muted)]">
            Код для примера: 123456. Письмо не отправляется, пароли не
            сохраняются.
          </p>
          {error && (
            <p
              role="alert"
              className="text-sm text-[color:var(--workspace-brand-danger)]"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Подключить почту</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStage("account");
                setCode("");
                setError("");
              }}
            >
              Back
            </Button>
            <Button type="button" variant="plain" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </form>
      ) : stage === "approve" ? (
        <div className="mt-5 space-y-4">
          <p className="break-all text-sm font-medium">{value}</p>
          <p className="text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
            {wallet
              ? "Подпишите запрос, чтобы подтвердить владение кошельком."
              : `Approve the sign-in request for this ${meta.title} account.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onComplete?.(value.trim());
                setStage("complete");
              }}
            >
              {wallet ? "Подтвердить подпись" : "Подтвердить подключение"}
            </Button>
            <Button variant="secondary" onClick={() => setStage("account")}>
              Back
            </Button>
            <Button variant="plain" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p role="status" className="text-sm">
            {meta.title} подключён в этом примере.
          </p>
          <Button variant="secondary" onClick={onCancel}>
            Done
          </Button>
        </div>
      )}
    </section>
  );
}
const focusPresentation =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBasePresentation =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-foreground)]";
const kitPresentation = {
  button: `${buttonBasePresentation} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focusPresentation}`,
  secondary: `${buttonBasePresentation} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focusPresentation}`,
  plain: `${buttonBasePresentation} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focusPresentation}`,
  danger: `${buttonBasePresentation} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focusPresentation}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focusPresentation,
};
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] enabled:hover:bg-[var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[var(--workspace-brand-muted)] enabled:hover:text-[var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-base text-[var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[var(--workspace-brand-muted)] focus-visible:border-[var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[var(--workspace-brand-background)] disabled:text-[var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[var(--workspace-brand-background)] aria-invalid:border-[var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5",
  muted: "text-[var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[var(--workspace-brand-foreground)]",
  focus: focus,
};
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const ButtonPresentation = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
