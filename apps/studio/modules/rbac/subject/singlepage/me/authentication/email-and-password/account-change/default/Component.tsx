"use client";
import type { IComponentProps, IAccountChangeProps } from "./interface";
export type { IAccountChangeProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import {
  type InputHTMLAttributes,
  useId as useIdPresentation,
  useState as useStatePresentation,
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
  type FormEvent,
} from "react";
import {
  twMerge as mergeButtonClass,
  twMerge as twMerge,
} from "tailwind-merge";
import {
  type default as IconGlyphs,
  default as IconPresentationGlyphs,
} from "../../../../../../../../shared/icon/singlepage/phosphor/icons.json";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <IconPresentation
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
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
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

function IconPresentation(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "me-authentication-email-and-password-account-change-default",
  kind = "email",
  email = "alex@example.com",
  onComplete,
  onCancel,
}: IComponentProps = {}) {
  const [step, setStep] = useState<
    "start" | "verify-current" | "details" | "verify-new" | "complete"
  >(kind === "password" ? "details" : "start");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const id = useId();
  const title = kind === "email" ? "Изменить почту" : "Изменить пароль";
  const steps =
    kind === "email"
      ? ["Подтвердите текущую почту", "Новая почта", "Подтвердите новую почту"]
      : ["Подтвердить почту", "Новый пароль"];
  const active = step === "details" ? 1 : step === "verify-new" ? 2 : 0;
  function advance(next: typeof step) {
    setStep(next);
    setError("");
    setCode("");
    setResent(false);
  }
  function complete(nextEmail?: string) {
    try {
      onComplete?.(nextEmail);
    } catch {
      setError("Не удалось сохранить изменения. Попробуйте ещё раз.");
      return;
    }
    setCurrentPassword("");
    setPassword("");
    setRepeat("");
    advance("complete");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === "verify-current" || step === "verify-new") {
      if (code.trim() !== "123456") {
        setError("Код неверный. В этом примере используйте 123456.");
        return;
      }
      if (step === "verify-new") complete(newEmail.trim().toLowerCase());
      else advance("details");
    } else if (kind === "email") {
      if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
        setError("Укажите другой адрес электронной почты.");
        return;
      }
      advance("verify-new");
    } else {
      if (password !== repeat) {
        setError("Новые пароли не совпадают.");
        return;
      }
      if (password === currentPassword) {
        setError("Новый пароль должен отличаться от текущего.");
        return;
      }
      complete();
    }
  }
  return (
    <section
      aria-label={title}
      className="mt-5 min-w-0 rounded-xl border border-border bg-muted p-4 sm:p-5"
      data-ds-block="rbac.subject.me-authentication-email-and-password-account-change-default"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <h4 className="text-base font-semibold">{title}</h4>
      {step === "complete" ? (
        <div className="mt-4 space-y-4">
          <p role="status" className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="size-5 shrink-0" />
            {kind === "email"
              ? `В примере почта изменена на ${newEmail.trim().toLowerCase()}.`
              : "В примере пароль изменён. Введённые пароли не сохраняются."}
          </p>
          <Button variant="secondary" onClick={onCancel}>
            Готово
          </Button>
        </div>
      ) : (
        <>
          {kind === "email" && (
            <ol
              aria-label="Этапы изменения"
              className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
            >
              {steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={active === index ? "step" : undefined}
                  className={
                    active === index ? "font-semibold text-foreground" : ""
                  }
                >
                  {index + 1}. {label}
                </li>
              ))}
            </ol>
          )}
          {step === "start" ? (
            <div className="mt-5 space-y-4">
              <p className="break-words text-sm leading-6 text-muted-foreground">
                Сначала подтвердите доступ к {email}. Затем{" "}
                {kind === "email"
                  ? "укажите и подтвердите новый адрес почты."
                  : "укажите текущий пароль и выберите новый."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => advance("verify-current")}>
                  <Mail className="size-4" />
                  Отправить код
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <form
              key={step}
              className="mt-5 grid min-w-0 max-w-xl gap-4"
              onSubmit={submit}
            >
              {step === "verify-current" || step === "verify-new" ? (
                <>
                  <p className="break-words text-sm leading-6 text-muted-foreground">
                    Введите код подтверждения для{" "}
                    <strong className="font-medium text-foreground">
                      {step === "verify-new"
                        ? newEmail.trim().toLowerCase()
                        : email}
                    </strong>
                    .
                  </p>
                  <label
                    className="grid min-w-0 gap-2 text-sm font-medium"
                    htmlFor={`${id}-code`}
                  >
                    Код подтверждения
                    <input
                      autoFocus
                      id={`${id}-code`}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      aria-describedby={`${id}-hint`}
                      aria-invalid={Boolean(error)}
                      className={kit.field}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        setError("");
                      }}
                    />
                  </label>
                  <p
                    id={`${id}-hint`}
                    className="text-xs text-muted-foreground"
                  >
                    Код для примера: 123456. Письмо не отправляется.
                  </p>
                  <div>
                    <Button
                      variant="plain"
                      type="button"
                      onClick={() => {
                        setResent(true);
                        setCode("");
                        setError("");
                      }}
                    >
                      Отправить код повторно
                    </Button>
                    {resent && (
                      <p
                        role="status"
                        className="mt-1 text-xs text-muted-foreground"
                      >
                        Новый код для примера: 123456.
                      </p>
                    )}
                  </div>
                </>
              ) : kind === "email" ? (
                <label className="grid min-w-0 gap-2 text-sm font-medium">
                  Новая почта
                  <input
                    autoFocus
                    type="email"
                    required
                    autoComplete="email"
                    className={kit.field}
                    value={newEmail}
                    onChange={(event) => {
                      setNewEmail(event.target.value);
                      setError("");
                    }}
                  />
                </label>
              ) : (
                <>
                  <PasswordField
                    label="Текущий пароль"
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setError("");
                    }}
                  />
                  <PasswordField
                    label="Новый пароль"
                    hint="Не менее 8 символов."
                    minLength={8}
                    name="new-password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                  />
                  <PasswordField
                    label="Повторите новый пароль"
                    minLength={8}
                    name="repeat-password"
                    autoComplete="new-password"
                    required
                    value={repeat}
                    onChange={(event) => {
                      setRepeat(event.target.value);
                      setError("");
                    }}
                  />
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  {step === "verify-new"
                    ? "Подтвердить новую почту"
                    : step === "details"
                      ? kind === "email"
                        ? "Подтвердите новую почту"
                        : "Изменить пароль"
                      : "Подтвердить код"}
                </Button>
                {kind === "email" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      advance(
                        step === "verify-new"
                          ? "details"
                          : step === "details"
                            ? "verify-current"
                            : "start",
                      )
                    }
                  >
                    Back
                  </Button>
                )}
                <Button type="button" variant="plain" onClick={onCancel}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
const Mail = createIcon("envelope");
const CheckCircle2 = createIcon("check-circle");
const focusPresentation =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBasePresentation =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kitPresentation = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
};
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
};
function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonControlProps<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain" | "danger";
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const appearances = {
    primary: "bg-primary text-primary-foreground enabled:hover:brightness-95",
    secondary:
      "border border-border bg-card text-foreground enabled:hover:bg-muted",
    plain: "text-muted-foreground enabled:hover:text-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95",
  };
  return (
    <button
      {...props}
      type={type}
      className={mergeButtonClass(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        appearances[variant],
        className,
      )}
    />
  );
}
function ButtonPresentation({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonControlProps<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain" | "danger";
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const appearances = {
    primary: "bg-primary text-primary-foreground enabled:hover:brightness-95",
    secondary:
      "border border-border bg-card text-foreground enabled:hover:bg-muted",
    plain: "text-muted-foreground enabled:hover:text-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95",
  };
  return (
    <button
      {...props}
      type={type}
      className={mergeButtonClass(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        appearances[variant],
        className,
      )}
    />
  );
}
