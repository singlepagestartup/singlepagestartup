"use client";
import type { IComponentProps, IIdentityDeleteProps } from "./interface";
export type { IIdentityDeleteProps } from "./interface";

import { useState, useRef } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useStudioAccount } from "../../account/Account";
import {
  getIdentityPrimaryLogin,
  getIdentityProviderMeta,
  type RbacIdentity,
} from "../../../../../shared";

export function Component({
  variant = "me-identity-delete",
  subjectId,
  identity,
  onDelete,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <div
      ref={setPortal}
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-identity-id={identity.id}
    >
      <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
          <Button appearance="plain">Remove identity</Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal container={portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              cancel.current?.focus();
            }}
          >
            <AlertDialog.Title className="text-xl font-semibold">
              Remove {getIdentityProviderMeta(identity.provider).title}?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
              Remove {getIdentityPrimaryLogin(identity)} from the sign-in
              methods in this preview? No external account is deleted.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button ref={cancel}>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button appearance="danger" onClick={() => onDelete(identity)}>
                  Remove identity
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
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
