"use client";
import type {
  IComponentProps,
  TAuthenticationMethod,
  ISelectMethodProps,
} from "./interface";
export type { TAuthenticationMethod, ISelectMethodProps } from "./interface";

import { twMerge as mergeButtonClass } from "tailwind-merge";

import {
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useId,
  useState,
  type ReactNode,
} from "react";
import { aiChatAccount } from "../../../account/fixture";
import { useStudioAccount } from "../../../account/Account";
import { Component as EmailAndPasswordAuthenticationForm } from "../../email-and-password/authentication-form/default/index";
import { Component as EthereumVirtualMachine } from "../../ethereum-virtual-machine/default/index";
import { Component as OAuthAuthorization } from "../../oauth/authorization/default/index";

export function Component({
  variant = "me-authentication-select-method-default",
  initialMethod = "email-and-password",
  onSuccess,
}: IComponentProps = {}) {
  const [method, setMethod] = useState(initialMethod);
  const id = useId();
  const { account, signIn } = useStudioAccount();
  const previewEmail = account.email ?? aiChatAccount.email!;
  const complete = useCallback(
    (email: string) => {
      signIn(email);
      onSuccess?.(email);
    },
    [signIn, onSuccess],
  );
  const methods: {
    value: TAuthenticationMethod;
    label: string;
  }[] = [
    { value: "email-and-password", label: "Email and password" },
    { value: "ethereum-virtual-machine", label: "EVM wallet" },
    { value: "oauth", label: "OAuth" },
  ];
  return (
    <div
      className="contents"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <EmailAndPasswordAuthenticationForm
        variant="me-authentication-email-and-password-authentication-form-default"
        onSuccess={complete}
        methodSelector={
          <div
            role="tablist"
            aria-label="Authentication method"
            className="flex flex-wrap gap-2"
          >
            {methods.map((item, index) => (
              <Button
                key={item.value}
                type="button"
                role="tab"
                id={`${id}-tab-${item.value}`}
                aria-selected={method === item.value}
                aria-controls={`${id}-panel-${item.value}`}
                tabIndex={method === item.value ? 0 : -1}
                variant={method === item.value ? "primary" : "secondary"}
                onClick={() => setMethod(item.value)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % methods.length
                      : event.key === "ArrowLeft"
                        ? (index + methods.length - 1) % methods.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? methods.length - 1
                            : undefined;
                  if (next === undefined) return;
                  event.preventDefault();
                  setMethod(methods[next].value);
                  (
                    event.currentTarget.parentElement?.children[next] as
                      | HTMLElement
                      | undefined
                  )?.focus();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        }
        showEmailFields={method === "email-and-password"}
        emailPanelProps={{
          role: "tabpanel",
          id: `${id}-panel-email-and-password`,
          "aria-labelledby": `${id}-tab-email-and-password`,
        }}
        methodContent={
          <>
            <div
              role="tabpanel"
              id={`${id}-panel-ethereum-virtual-machine`}
              aria-labelledby={`${id}-tab-ethereum-virtual-machine`}
              hidden={method !== "ethereum-virtual-machine"}
            >
              <EthereumVirtualMachine
                onSuccess={() => complete(previewEmail)}
              />
            </div>
            <div
              role="tabpanel"
              id={`${id}-panel-oauth`}
              aria-labelledby={`${id}-tab-oauth`}
              hidden={method !== "oauth"}
            >
              <OAuthAuthorization
                accountEmail={previewEmail}
                onSuccess={() => complete(previewEmail)}
              />
            </div>
          </>
        }
      />
    </div>
  );
}

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
