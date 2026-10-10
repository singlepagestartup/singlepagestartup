"use client";
import { memo, useRef, useState, type ReactNode } from "react";
import { Button } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ConfirmationDialog } from "../../../../../workspace/design/singlepage/interface-kit/Confirmation";
import {
  Check,
  ChevronDown,
} from "../../../../../workspace/utils/components/ModuleIcons";
import {
  defaultSettingsIdentities,
  formatRbacDateTime,
  getIdentityActions,
  getIdentityPrimaryLogin,
  getIdentityProviderMeta,
  type IdentityAction,
  type RbacIdentity,
} from "../../../shared";

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
      className="min-w-0 rounded-xl border border-sps-line bg-sps-white p-4 sm:p-5"
      data-ds-block="rbac.identity.card-default"
      data-ds-layer="singlepage"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sps-grey">
          <ProviderIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{meta.title}</h3>
          <p className="mt-1 break-all text-sm text-sps-muted">
            {getIdentityPrimaryLogin(identity)}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-xs text-sps-muted sm:inline-flex">
          <Check className="size-3" />
          Connected
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-sps-muted">
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
      <details className="group mt-4 border-t border-sps-line pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-medium text-sps-muted focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
          <span>Connection details</span>
          <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <dl className="grid min-w-0 gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-sps-muted">Connected</dt>
            <dd className="mt-1">{formatRbacDateTime(identity.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sps-muted">Last updated</dt>
            <dd className="mt-1">{formatRbacDateTime(identity.updatedAt)}</dd>
          </div>
        </dl>
      </details>
      <ConfirmationDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={`Remove ${meta.title}?`}
        description={`Remove ${getIdentityPrimaryLogin(identity)} from the sign-in methods in this preview? No external account is deleted.`}
        confirmLabel="Remove identity"
        onConfirm={() => {
          if (!pendingAction) return;
          if (onAction) onAction(identity, pendingAction);
          else setLocalResult("Identity removal requested in this preview.");
          setPendingAction(null);
        }}
        portalContainer={portalContainer}
      />
    </article>
  );
});
