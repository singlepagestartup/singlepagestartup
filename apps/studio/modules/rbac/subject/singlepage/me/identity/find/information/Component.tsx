"use client";
import type {
  IComponentProps,
  SubjectMeIdentityFindInformationProps,
} from "./interface";
export type { SubjectMeIdentityFindInformationProps } from "./interface";

import {
  useState,
  useCallback,
  useEffect,
  memo,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import { twMerge as mergeButtonClass } from "tailwind-merge";
import { Component as Identity } from "../../../../../../identity";
import { useStudioAccount } from "../../../account/Account";
import { aiChatAccount } from "../../../account/fixture";
import {
  defaultSettingsIdentities,
  type RbacIdentity,
} from "../../../../../../shared";
import { Component as ChangeEmail } from "../../change-email";
import { Component as ChangePassword } from "../../change-password";
import { Component as DeleteIdentity } from "../../delete";
import { Component as ConnectEmail } from "../../create/email-and-password";
import { Component as ConnectGoogle } from "../../create/oauth-google";
import { Component as ConnectTelegram } from "../../create/telegram";
import { Component as ConnectWallet } from "../../create/ethereum-virtual-machine";

const connectors = [
  ConnectEmail,
  ConnectGoogle,
  ConnectTelegram,
  ConnectWallet,
];
const providers = [
  "email_and_password",
  "oauth_google",
  "telegram",
  "ethereum_virtual_machine",
];
export function SubjectMeIdentityFindInformation(props: IComponentProps = {}) {
  const { title, description, emptyLabel } = {
    ...defaultSubjectMeIdentityFindInformationProps,
    ...props,
  };
  const session = useStudioAccount();
  const email = session.account.email ?? aiChatAccount.email;
  const subjectId = session.account.subject?.id;
  const [identities, setIdentities] = useState(
    () =>
      props.identities ??
      defaultSettingsIdentities.map((item) => ({
        ...item,
        email: item.email ? email : "",
        account:
          item.provider === "telegram" ? "@alex" : item.account ? email : "",
      })),
  );
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => {
    if (props.identities) setIdentities(props.identities);
    else
      setIdentities((current) =>
        current.map((item) =>
          item.provider === "email_and_password" ? { ...item, email } : item,
        ),
      );
  }, [email, props.identities]);
  const { updateEmail } = session;
  const handleUpdate = useCallback(
    (identity: RbacIdentity) => {
      if (!props.identities && identity.provider === "email_and_password")
        updateEmail(identity.email);
      setIdentities((current) =>
        current.map((item) => (item.id === identity.id ? identity : item)),
      );
    },
    [updateEmail, props.identities],
  );
  const handleDelete = useCallback((identity: RbacIdentity) => {
    setIdentities((current) =>
      current.filter((item) => item.id !== identity.id),
    );
    setResult("Способ входа отключён в этом примере.");
  }, []);
  const connect = useCallback(
    (provider: string, account: string) => {
      if (provider === "email_and_password" && !props.identities)
        updateEmail(account);
      const date = new Date().toISOString();
      setIdentities((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          provider,
          email:
            provider === "oauth_google" || provider === "email_and_password"
              ? account
              : "",
          account,
          variant: "default",
          createdAt: date,
          updatedAt: date,
        },
      ]);
      setAdding(false);
      setResult("Способ входа подключён в этом примере.");
    },
    [updateEmail, props.identities],
  );
  return (
    <article
      className="min-w-0 rounded-2xl border border-border bg-card p-4 font-default text-foreground sm:p-6"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant ?? "me-identity-find-information"}
      data-subject-id={subjectId}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          {identities.length} подключено
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {identities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          identities.map((identity) => (
            <SubjectIdentityRow
              key={identity.id}
              subjectId={subjectId}
              identity={identity}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      {result && (
        <p role="status" className="mt-4 text-sm">
          {result}
        </p>
      )}
      <div className="mt-6 border-t border-border pt-5">
        <Button
          variant="secondary"
          aria-expanded={adding}
          onClick={() => setAdding((value) => !value)}
        >
          Добавить способ входа
        </Button>
        {adding && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Выберите способ</h3>
            <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
              {connectors.map((Connect, index) => (
                <Connect
                  key={providers[index]}
                  subjectId={subjectId}
                  connected={identities.some(
                    (identity) => identity.provider === providers[index],
                  )}
                  onComplete={(account) => connect(providers[index], account)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

interface ISubjectIdentityRowProps {
  subjectId?: string;
  identity: RbacIdentity;
  onUpdate: (identity: RbacIdentity) => void;
  onDelete: (identity: RbacIdentity) => void;
}
const SubjectIdentityRow = memo(function SubjectIdentityRow({
  subjectId,
  identity,
  onUpdate,
  onDelete,
}: ISubjectIdentityRowProps) {
  const Connect = connectors[providers.indexOf(identity.provider)];
  const reconnect = useCallback(
    (account: string) =>
      onUpdate({
        ...identity,
        account,
        email: identity.provider === "oauth_google" ? account : identity.email,
      }),
    [identity, onUpdate],
  );
  return (
    <Identity
      variant="card-default"
      identity={identity}
      actions={
        <div className="mt-4 flex flex-wrap gap-2">
          {identity.provider === "email_and_password" ? (
            <>
              <ChangeEmail
                subjectId={subjectId}
                identity={identity}
                onUpdate={onUpdate}
              />
              <ChangePassword
                subjectId={subjectId}
                identity={identity}
                onUpdate={onUpdate}
              />
            </>
          ) : (
            Connect && (
              <Connect
                subjectId={subjectId}
                reconnect
                account={identity.account || identity.email}
                onComplete={reconnect}
              />
            )
          )}
          <DeleteIdentity
            subjectId={subjectId}
            identity={identity}
            onDelete={onDelete}
          />
        </div>
      }
    />
  );
});

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
export const defaultSubjectMeIdentityFindInformationProps: SubjectMeIdentityFindInformationProps =
  {
    title: "Способы входа",
    description:
      "Выберите, как входить в аккаунт. Каждое подключение можно настроить отдельно.",
    emptyLabel: "К этому аккаунту пока не подключены способы входа.",
  };
