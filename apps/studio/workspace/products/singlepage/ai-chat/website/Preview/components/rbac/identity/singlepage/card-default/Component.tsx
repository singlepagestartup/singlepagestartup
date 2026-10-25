"use client";
import { useState as useStatePresentation } from "react";
import { useRef as useRefPresentation } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { forwardRef as forwardRef } from "react";
import { type SVGProps as SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import { memo, useRef, useState, type ReactNode } from "react";
import {
  defaultSettingsIdentities,
  formatRbacDateTime,
  getIdentityActions,
  getIdentityPrimaryLogin,
  getIdentityProviderMeta,
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
interface IConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  portalContainer?: HTMLElement | null;
}
function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  portalContainer,
}: IConfirmationDialogProps) {
  const [portal, setPortal] = useStatePresentation<HTMLElement | null>(null);
  const cancel = useRefPresentation<HTMLButtonElement>(null);
  const returnFocus = useRefPresentation<HTMLElement | null>(null);
  return (
    <div ref={setPortal}>
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portalContainer ?? portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current = document.activeElement as HTMLElement;
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) returnFocus.current.focus();
              else portalContainer?.focus();
            }}
          >
            <AlertDialog.Title className="text-xl font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              className={`mt-3 text-sm leading-6 ${kit.muted}`}
            >
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button ref={cancel} variant="secondary">
                  Отмена
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
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
export interface IIdentityFlowProps {
  identity: RbacIdentity;
  action: "change-email" | "change-password" | "reconnect";
  onClose: () => void;
  onUpdate: (identity: RbacIdentity) => void;
}
export interface IdentityCardDefaultProps {
  renderFlow?: (props: IIdentityFlowProps) => ReactNode;
  identity: RbacIdentity;
  lastOperationLabel?: string;
  onAction?: (identity: RbacIdentity, action: IdentityAction) => void;
  onUpdate?: (identity: RbacIdentity) => void;
  embedded?: boolean;
}
const ChevronDown = createIcon("caret-down");
const Check = createIcon("check");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-foreground)]";
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
export const defaultIdentityCardDefaultProps: IdentityCardDefaultProps = {
  identity: defaultSettingsIdentities[0],
};
export const IdentityCardDefault = memo(function IdentityCardDefault(
  props: Partial<IdentityCardDefaultProps>,
) {
  const {
    identity: initialIdentity,
    lastOperationLabel,
    onAction,
    onUpdate,
    renderFlow,
  } = { ...defaultIdentityCardDefaultProps, ...props };
  const [localIdentity, setLocalIdentity] = useState<RbacIdentity>();
  const identity =
    localIdentity?.id === initialIdentity.id ? localIdentity : initialIdentity;
  const meta = getIdentityProviderMeta(identity.provider);
  const ProviderIcon = meta.icon;
  const [flow, setFlow] = useState<
    "change-email" | "change-password" | "reconnect" | null
  >(null);
  const [pendingAction, setPendingAction] = useState<IdentityAction | null>(
    null,
  );
  const [localResult, setLocalResult] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  function closeFlow() {
    const key = flow;
    setFlow(null);
    if (key) buttons.current[key]?.focus();
  }
  function update(next: RbacIdentity) {
    if (onUpdate) onUpdate(next);
    else setLocalIdentity(next);
  }
  return (
    <article
      ref={setPortalContainer}
      className="min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-4 sm:p-5"
      data-ds-block="rbac.identity.card-default"
      data-ds-layer="singlepage"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--workspace-brand-background)]">
          <ProviderIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{meta.title}</h3>
          <p className="mt-1 break-all text-sm text-[color:var(--workspace-brand-muted)]">
            {getIdentityPrimaryLogin(identity)}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-xs text-[color:var(--workspace-brand-muted)] sm:inline-flex">
          <Check className="size-3" />
          Подключено
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
        {meta.description}
      </p>
      <div className="mt-4 flex max-w-full flex-wrap gap-2">
        {getIdentityActions(identity).map((action) => (
          <Button
            ref={(node) => {
              buttons.current[action.key] = node;
            }}
            variant={action.tone === "danger" ? "plain" : "secondary"}
            key={action.key}
            onClick={() => {
              setLocalResult("");
              if (action.key === "delete") {
                setPendingAction(action);
                return;
              }
              if (
                action.key === "change-email" ||
                action.key === "change-password" ||
                action.key === "reconnect"
              ) {
                if (renderFlow) setFlow(action.key);
                else onAction?.(identity, action);
              }
            }}
            type="button"
            aria-expanded={
              action.key === "delete" ? undefined : flow === action.key
            }
          >
            {action.label}
          </Button>
        ))}
      </div>
      {flow &&
        renderFlow?.({
          identity,
          action: flow,
          onClose: closeFlow,
          onUpdate: update,
        })}
      {(lastOperationLabel || localResult) && (
        <p role="status" className="mt-4 text-sm">
          {lastOperationLabel ?? localResult}
        </p>
      )}
      <details className="group mt-4 border-t border-[color:var(--workspace-brand-line)] pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-medium text-[color:var(--workspace-brand-muted)] focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
          <span>Данные подключения</span>
          <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <dl className="grid min-w-0 gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[color:var(--workspace-brand-muted)]">
              Подключено
            </dt>
            <dd className="mt-1">{formatRbacDateTime(identity.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--workspace-brand-muted)]">
              Последнее обновление
            </dt>
            <dd className="mt-1">{formatRbacDateTime(identity.updatedAt)}</dd>
          </div>
        </dl>
      </details>
      <ConfirmationDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={`Удалить ${meta.title}?`}
        description={`Удалить ${getIdentityPrimaryLogin(identity)} from the sign-in methods in this preview? No external account is deleted.`}
        confirmLabel="Отключить способ входа"
        onConfirm={() => {
          if (!pendingAction) return;
          if (onAction) onAction(identity, pendingAction);
          else
            setLocalResult(
              "В этом примере отправлен запрос на отключение способа входа.",
            );
          setPendingAction(null);
        }}
        portalContainer={portalContainer}
      />
    </article>
  );
});
