"use client";
import type { IComponentProps, IIdentityCreateProps } from "./interface";
export type { IIdentityCreateProps } from "./interface";

import { useState } from "react";
import { useStudioAccount } from "../../../account/Account";
import { getIdentityProviderMeta } from "../../../../../../shared";
import { Component as ProviderConnect } from "../../../authentication/provider-connect/default";

export function Component({
  variant = "me-identity-create-email-and-password",
  subjectId,
  connected = false,
  account: login,
  reconnect = false,
  onComplete,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const [open, setOpen] = useState(false);
  const meta = getIdentityProviderMeta("email_and_password");
  const Glyph = meta.icon;
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-provider="email_and_password"
    >
      <button
        type="button"
        disabled={connected}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-muted focus-visible:outline-2 disabled:cursor-default disabled:text-muted-foreground"
      >
        <Glyph className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          {reconnect ? "Подключить заново" : meta.title}
        </span>
        {connected && <span className="text-xs">Подключено</span>}
      </button>
      {open && (
        <ProviderConnect
          provider="email_and_password"
          account={login}
          onCancel={() => setOpen(false)}
          onComplete={(value) => {
            onComplete(value);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
