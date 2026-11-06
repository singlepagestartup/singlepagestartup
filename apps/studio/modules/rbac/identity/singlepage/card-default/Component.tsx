"use client";
import type {
  IComponentProps,
  IIdentityFlowProps,
  IdentityCardDefaultProps,
} from "./interface";
export type { IIdentityFlowProps, IdentityCardDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  useState as useStatePresentation,
  useRef as useRefPresentation,
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
  memo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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
type IconName = keyof typeof IconGlyphs;
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
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 font-default text-foreground shadow-xl"
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
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

const ChevronDown = createIcon("caret-down");
const Check = createIcon("check");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  muted: "text-muted-foreground",
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
    primary: "bg-primary text-primary-foreground",
    secondary: "border border-border bg-card",
    plain: "text-muted-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive",
  };
  return (
    <button
      {...props}
      type={type}
      className={twMerge(buttonBase, focus, appearances[variant], className)}
    />
  );
}
export const defaultIdentityCardDefaultProps: IdentityCardDefaultProps = {
  identity: defaultSettingsIdentities[0],
};
export const IdentityCardDefault = memo(function IdentityCardDefault(
  props: IComponentProps,
) {
  const {
    identity: initialIdentity,
    lastOperationLabel,
    onAction,
    onUpdate,
    renderFlow,
    actions,
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
      className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5"
      data-ds-block="rbac.identity.card-default"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="identity"
      data-variant={props.variant ?? "card-default"}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
          <ProviderIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{meta.title}</h3>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {getIdentityPrimaryLogin(identity)}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
          <Check className="size-3" />
          Подключено
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {meta.description}
      </p>
      {actions ?? (
        <>
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
        </>
      )}
      {(lastOperationLabel || localResult) && (
        <p role="status" className="mt-4 text-sm">
          {lastOperationLabel ?? localResult}
        </p>
      )}
      <details className="group mt-4 border-t border-border pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-medium text-muted-foreground focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
          <span>Данные подключения</span>
          <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <dl className="grid min-w-0 gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Подключено</dt>
            <dd className="mt-1">{formatRbacDateTime(identity.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Последнее обновление</dt>
            <dd className="mt-1">{formatRbacDateTime(identity.updatedAt)}</dd>
          </div>
        </dl>
      </details>
      {actions === undefined && (
        <ConfirmationDialog
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={`Remove ${meta.title}?`}
          description={`Remove ${getIdentityPrimaryLogin(identity)} from the sign-in methods in this preview? No external account is deleted.`}
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
      )}
    </article>
  );
});
