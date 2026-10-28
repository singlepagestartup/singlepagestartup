"use client";
import {
  forwardRef as forwardRef,
  type SVGProps as SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useEffect,
  useState,
} from "react";

import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";

import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import type { IIdentityFlowProps } from "../../../identity/singlepage/card-default/Component";
import { Component as AuthenticationProviderConnect } from "../authentication/provider-connect/default/index";
import { Component as AuthenticationAccountChange } from "../authentication/email-and-password/account-change/default/index";
import { Component as RbacModuleIdentity } from "../../../identity/index";

import { useStudioAccount } from "../account/Account";
import { aiChatAccount } from "../account/fixture";
import {
  defaultSettingsIdentities,
  identityProviders,
  type IdentityAction,
  type RbacIdentity,
} from "../../../shared";
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
          <Icon
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
export interface SubjectMeIdentityFindInformationProps {
  title?: string;
  description?: string;
  emptyLabel?: string;
  identities?: RbacIdentity[];
}
export function SubjectMeIdentityFindInformation(
  props: SubjectMeIdentityFindInformationProps = {},
) {
  const { title, description, emptyLabel } = {
    ...defaultSubjectMeIdentityFindInformationProps,
    ...props,
  };
  const session = useStudioAccount();
  const email = session.account.email ?? aiChatAccount.email;
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
  const [provider, setProvider] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => {
    if (!props.identities)
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
  const renderFlow = useCallback(
    ({ identity, action, onClose, onUpdate }: IIdentityFlowProps) =>
      action === "reconnect" ? (
        <AuthenticationProviderConnect
          key={action}
          provider={identity.provider}
          account={identity.account || identity.email}
          onCancel={onClose}
          onComplete={(account) =>
            onUpdate({
              ...identity,
              account,
              email:
                identity.provider === "oauth_google" ? account : identity.email,
            })
          }
        />
      ) : (
        <AuthenticationAccountChange
          key={action}
          kind={action === "change-email" ? "email" : "password"}
          email={identity.email}
          onCancel={onClose}
          onComplete={(email) => {
            if (email) onUpdate({ ...identity, email });
          }}
        />
      ),
    [],
  );
  const handleAction = useCallback(
    (identity: RbacIdentity, action: IdentityAction) => {
      if (action.key !== "delete") return;
      setIdentities((current) =>
        current.filter((item) => item.id !== identity.id),
      );
      setResult("Способ входа отключён в этом примере.");
    },
    [],
  );
  return (
    <article
      className="min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-4 font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] sm:p-6"
      data-ds-block="rbac.subject.me-identity-find-information"
      data-ds-imports="rbac.identity.card-default rbac.subject.authentication-provider-connect-default"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-[color:var(--workspace-brand-background)] px-3 py-1.5 text-xs text-[color:var(--workspace-brand-muted)]">
          Подключено: {identities.length}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {identities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[color:var(--workspace-brand-line)] p-6 text-sm text-[color:var(--workspace-brand-muted)]">
            {emptyLabel}
          </p>
        ) : (
          identities.map((identity) => (
            <RbacModuleIdentity
              variant="card-default"
              identity={identity}
              key={identity.id}
              renderFlow={renderFlow}
              onUpdate={handleUpdate}
              onAction={handleAction}
            />
          ))
        )}
      </div>
      {result && (
        <p role="status" className="mt-4 text-sm">
          {result}
        </p>
      )}
      <div className="mt-6 border-t border-[color:var(--workspace-brand-line)] pt-5">
        <Button
          variant="secondary"
          onClick={() => {
            setAdding((value) => !value);
            setProvider(undefined);
          }}
          aria-expanded={adding}
        >
          <Plus className="size-4" />
          Добавить способ входа
        </Button>
        {adding && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Выберите способ</h3>
            <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
              {identityProviders.map((item) => {
                const Glyph = item.icon;
                const connected = identities.some(
                  (identity) => identity.provider === item.key,
                );
                return (
                  <button
                    key={item.key}
                    disabled={connected}
                    onClick={() => setProvider(item.key)}
                    type="button"
                    className="flex min-h-14 items-center gap-3 rounded-xl border border-[color:var(--workspace-brand-line)] px-4 py-3 text-left text-sm hover:bg-[color:var(--workspace-brand-background)] focus-visible:outline-2 disabled:cursor-default disabled:text-[color:var(--workspace-brand-muted)]"
                  >
                    <Glyph className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">{item.title}</span>
                    {connected && <span className="text-xs">Подключено</span>}
                  </button>
                );
              })}
            </div>
            {provider && (
              <AuthenticationProviderConnect
                key={provider}
                provider={provider}
                onCancel={() => setProvider(undefined)}
                onComplete={(account) => {
                  if (provider === "email_and_password" && !props.identities)
                    updateEmail(account);
                  const date = new Date().toISOString();
                  setIdentities((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      provider,
                      email:
                        provider === "oauth_google" ||
                        provider === "email_and_password"
                          ? account
                          : "",
                      account,
                      variant: "default",
                      createdAt: date,
                      updatedAt: date,
                    },
                  ]);
                  setAdding(false);
                  setProvider(undefined);
                  setResult("Способ входа подключён в этом примере.");
                }}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
const Plus = createIcon("plus");
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
export const defaultSubjectMeIdentityFindInformationProps: SubjectMeIdentityFindInformationProps =
  {
    title: "Способы входа",
    description:
      "Выберите, как входить в аккаунт. Каждое подключение можно настроить отдельно.",
    emptyLabel: "К этому аккаунту пока не подключены способы входа.",
  };
