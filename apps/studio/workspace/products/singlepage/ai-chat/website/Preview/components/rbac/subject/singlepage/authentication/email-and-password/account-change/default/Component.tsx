"use client";
import {
  type InputHTMLAttributes as InputHTMLAttributes,
  useId as useIdPresentation,
  useState as useStatePresentation,
  forwardRef as forwardRef,
  type SVGProps as SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
  type FormEvent,
} from "react";

import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../../website-builder/button/index";

import IconGlyphs from "../../../../../../../website-builder/feature/singlepage/icon/icons.json";

interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "arrow-up-right"
  | "bank"
  | "bell"
  | "book-open"
  | "bookmark-simple"
  | "calendar-blank"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "chart-bar"
  | "chat"
  | "chat-circle"
  | "check"
  | "check-circle"
  | "clock"
  | "code"
  | "confetti"
  | "credit-card"
  | "cube"
  | "currency-circle-dollar"
  | "database"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "file-text"
  | "floppy-disk"
  | "folder-open"
  | "gear-six"
  | "github-logo"
  | "globe"
  | "google-chrome-logo"
  | "hash"
  | "house"
  | "image"
  | "key"
  | "lightning"
  | "link"
  | "link-break"
  | "linkedin-logo"
  | "list"
  | "lock-key"
  | "magnifying-glass"
  | "map-pin"
  | "megaphone"
  | "minus"
  | "monitor"
  | "newspaper"
  | "package"
  | "palette"
  | "paper-plane-tilt"
  | "paperclip"
  | "pencil-simple"
  | "phone"
  | "play"
  | "plus"
  | "push-pin"
  | "question"
  | "robot"
  | "share-network"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "sign-in"
  | "sign-out"
  | "smiley"
  | "squares-four"
  | "stack"
  | "star"
  | "tag"
  | "text-b"
  | "text-italic"
  | "thumbs-up"
  | "trash"
  | "trend-up"
  | "twitter-logo"
  | "upload-simple"
  | "user"
  | "user-circle"
  | "user-plus"
  | "users"
  | "wallet"
  | "warning"
  | "x";
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
function IconPresentation({
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
export interface IAccountChangeProps {
  kind?: "email" | "password";
  email?: string;
  onComplete?: (email?: string) => void;
  onCancel?: () => void;
}
export function Component({
  kind = "email",
  email = "alex@example.com",
  onComplete,
  onCancel,
}: IAccountChangeProps = {}) {
  const [step, setStep] = useState<
    "start" | "verify-current" | "details" | "verify-new" | "complete"
  >("start");
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
      className="mt-5 min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-background)] p-4 sm:p-5"
      data-ds-block="rbac.subject.authentication-email-and-password-account-change-default"
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
          <ol
            aria-label="Этапы изменения"
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[color:var(--workspace-brand-muted)]"
          >
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={active === index ? "step" : undefined}
                className={
                  active === index
                    ? "font-semibold text-[color:var(--workspace-brand-foreground)]"
                    : ""
                }
              >
                {index + 1}. {label}
              </li>
            ))}
          </ol>
          {step === "start" ? (
            <div className="mt-5 space-y-4">
              <p className="break-words text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
                Сначала подтвердите доступ к {email}. Затем{" "}
                {kind === "email"
                  ? "укажите и подтвердите новую почту."
                  : "введите текущий пароль и придумайте новый."}
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
                  <p className="break-words text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
                    Введите код подтверждения для{" "}
                    <strong className="font-medium text-[color:var(--workspace-brand-foreground)]">
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
                    className="text-xs text-[color:var(--workspace-brand-muted)]"
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
                        className="mt-1 text-xs text-[color:var(--workspace-brand-muted)]"
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
                <p
                  role="alert"
                  className="text-sm text-[color:var(--workspace-brand-danger)]"
                >
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
