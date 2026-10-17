"use client";
import type {
  IComponentProps,
  ILoginCopy,
  ILoginProps,
  ILoginErrors,
} from "./interface";
export type { ILoginCopy, ILoginProps, ILoginErrors } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { twMerge as mergeButtonClass } from "tailwind-merge";

import {
  type ReactNode,
  type InputHTMLAttributes,
  useId as useIdPresentation,
  useState as useStatePresentation,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
  type FormEvent,
} from "react";
import type IconGlyphs from "../../../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { useStudioAccount } from "../../../../account/Account";
import defaultCopy from "./content.json";
function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: ITextFieldProps) {
  const generatedId = useIdPresentation();
  const id = suppliedId ?? generatedId;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kit.label}`}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${kit.field} ${className}`}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
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
      <label htmlFor={id} className={`block ${kit.label}`}>
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
          className={`${kit.field} pr-14`}
        />
        <Button
          variant="plain"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute top-0.5 right-1 min-h-11 w-11 px-2"
        >
          <Icon name={visible ? "eye-slash" : "eye"} />
        </Button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
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
interface IFeedbackProps {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}
function Feedback({ children, kind = "success" }: IFeedbackProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-destructive-border bg-destructive-surface text-destructive" : "border-border bg-muted"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={kind === "success" ? "text-foreground" : ""}
      />
      <div className="min-w-0">{children}</div>
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

export function Component({
  variant = "me-authentication-email-and-password-authentication-form-ai-chat",
  copy = defaultCopy,
  onSuccess,
}: IComponentProps = {}) {
  const { signIn } = useStudioAccount();
  const label = copy.labels;
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ILoginErrors>({});
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email");
    const nextErrors: ILoginErrors = {};
    if (
      !email.trim() ||
      (input instanceof HTMLInputElement && input.validity.typeMismatch)
    ) {
      nextErrors.email = label["email-error"];
    }
    if (!password) nextErrors.password = label["password-error"];
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      const field = event.currentTarget.elements.namedItem(firstError);
      if (field instanceof HTMLElement) field.focus();
    }
    const valid = Object.keys(nextErrors).length === 0;
    setSubmitted(valid);
    if (valid) {
      signIn(email.trim());
      onSuccess?.(email.trim());
    }
  }
  return (
    <section
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      aria-labelledby={`${id}-title`}
      className="min-w-0 rounded-2xl border border-border bg-card p-5 @[640px]:p-6"
    >
      <h2
        id={`${id}-title`}
        className="flex items-center gap-3 text-xl font-semibold"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon name="sign-in" />
        </span>
        {copy.title}
      </h2>
      {copy.description.map((paragraph, index) => (
        <p key={index} className="mt-3 text-sm leading-6 text-muted-foreground">
          {paragraph}
        </p>
      ))}
      <form
        noValidate
        onSubmit={submit}
        className="mt-5 grid content-start gap-5"
      >
        <TextField
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          label={label["email-label"]}
          placeholder={label["email-placeholder"]}
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
            setSubmitted(false);
          }}
        />
        <PasswordField
          id={`${id}-password`}
          name="password"
          autoComplete="current-password"
          required
          label={label["password-label"]}
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
            setSubmitted(false);
          }}
        />
        <a
          className={`w-fit text-sm underline decoration-border underline-offset-4 ${kit.focus}`}
          href={label["forgot-href"]}
        >
          {label["forgot-label"]}
        </a>
        <Button type="submit" className="w-full justify-center">
          {label.submit}
          <Icon name="arrow-right" />
        </Button>
        <p className="text-center text-sm leading-6 text-muted-foreground">
          {label["no-account"]}{" "}
          <a
            className={`font-semibold text-foreground underline underline-offset-4 ${kit.focus}`}
            href={label["register-href"]}
          >
            {label["register-label"]}
          </a>
        </p>
      </form>
      {submitted ? (
        <div className="mt-6 grid gap-4">
          <Feedback kind="success">{label["success-message"]}</Feedback>
          <p className="text-sm leading-6 text-muted-foreground">
            {copy.successDescription.join(" ")}
          </p>
          <a className={`${kit.secondary} w-fit`} href={label["continue-href"]}>
            {label["continue-label"]}
            <Icon name="arrow-right" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
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
