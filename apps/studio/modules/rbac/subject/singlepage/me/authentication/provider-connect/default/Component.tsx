"use client";
import type { IComponentProps, IProviderConnectProps } from "./interface";
export type { IProviderConnectProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../shared/icon";

import { twMerge as mergeButtonClass } from "tailwind-merge";

import {
  type InputHTMLAttributes,
  useId as useIdPresentation,
  useState as useStatePresentation,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
} from "react";
import type IconGlyphs from "../../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { getIdentityProviderMeta } from "../../../../../../shared";
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
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
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

export function Component({
  variant = "me-authentication-provider-connect-default",
  provider = "oauth_google",
  account = "",
  onComplete,
  onCancel,
}: IComponentProps = {}) {
  const meta = getIdentityProviderMeta(provider);
  const credentials = meta.kind === "credentials";
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const wallet = provider === "ethereum_virtual_machine";
  const [stage, setStage] = useState<"me-account" | "approve" | "complete">(
    "me-account",
  );
  const [value, setValue] = useState(account);
  const id = useId();
  return (
    <section
      className="mt-5 min-w-0 rounded-xl border border-border bg-muted p-4 sm:p-5"
      aria-label={`Connect ${meta.title}`}
      data-ds-block="rbac.subject.me-authentication-provider-connect-default"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <h4 className="font-semibold">Connect {meta.title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {credentials
          ? "Add your email and password, then verify the email address."
          : wallet
            ? "Choose a wallet, then approve an ownership signature. No transaction or payment is required."
            : `Continue with ${meta.title}, then approve access to sign in.`}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Connection preview. No external account or wallet is contacted.
      </p>
      {stage === "me-account" ? (
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
              ? "Wallet address"
              : provider === "telegram"
                ? "Telegram username"
                : "Account email"}
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
              label="Password"
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
                ? "Send verification code"
                : wallet
                  ? "Continue with wallet"
                  : `Continue with ${meta.title}`}
            </Button>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : stage === "approve" && credentials ? (
        <form
          className="mt-5 grid min-w-0 max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code !== "123456") {
              setError("That code is incorrect. Use the preview code 123456.");
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
            Verification code
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
          <p className="text-xs text-muted-foreground">
            Preview code: 123456. No email is sent. Passwords are not stored.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Connect email</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStage("me-account");
                setCode("");
                setError("");
              }}
            >
              Back
            </Button>
            <Button type="button" variant="plain" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : stage === "approve" ? (
        <div className="mt-5 space-y-4">
          <p className="break-all text-sm font-medium">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {wallet
              ? "Confirm the signature request to verify this wallet belongs to you."
              : `Approve the sign-in request for this ${meta.title} account.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onComplete?.(value.trim());
                setStage("complete");
              }}
            >
              {wallet ? "Approve signature" : "Approve connection"}
            </Button>
            <Button variant="secondary" onClick={() => setStage("me-account")}>
              Back
            </Button>
            <Button variant="plain" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p role="status" className="text-sm">
            {meta.title} connected in this preview.
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
