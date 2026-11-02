"use client";
import type { IComponentProps, IIdentityChangeProps } from "./interface";
export type { IIdentityChangeProps } from "./interface";

import { useState, useRef } from "react";
import { useStudioAccount } from "../../account/Account";
import type { RbacIdentity } from "../../../../../shared";
import { Component as AccountChange } from "../../authentication/email-and-password/account-change/default";

export function Component({
  variant = "me-identity-change-email",
  subjectId,
  identity,
  onUpdate,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-identity-id={identity.id}
    >
      <Button
        ref={trigger}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Изменить почту
      </Button>
      {open && (
        <AccountChange
          kind="email"
          email={identity.email}
          onCancel={close}
          onComplete={(email) => {
            if (email) onUpdate({ ...identity, email });
          }}
        />
      )}
    </div>
  );
}

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  appearance?: "secondary" | "plain" | "danger";
}
function Button({
  appearance = "secondary",
  type = "button",
  ...props
}: IButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold focus-visible:outline-2 disabled:opacity-50 ${appearance === "secondary" ? "border border-border bg-card" : appearance === "danger" ? "border border-destructive-border bg-destructive-surface text-destructive" : "text-muted-foreground"}`}
    />
  );
}
