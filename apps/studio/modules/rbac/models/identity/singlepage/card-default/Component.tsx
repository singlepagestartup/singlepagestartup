import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ConfirmationDialog } from "../../../../../../workspace/design/singlepage/interface-kit/Confirmation";
import { memo, useState } from "react";
import {
  Check,
  ChevronDown,
  type ModuleIcon,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  formatRbacDateTime,
  getIdentityActions,
  getIdentityPrimaryLogin,
  getIdentityProviderMeta,
  type IdentityAction,
  type RbacIdentity,
} from "../../../../shared";

export interface IdentityCardDefaultProps {
  identity: RbacIdentity;
  lastOperationLabel?: string;
  onAction?: (identity: RbacIdentity, action: IdentityAction) => void;
  embedded?: boolean;
}

export const defaultIdentityCardDefaultProps: IdentityCardDefaultProps = {
  identity: {
    id: "f3b3934d-3199-4f04-9e8e-99c4ab0a47a1",
    provider: "email_and_password",
    email: "rogwild@sps.dev",
    account: "",
    variant: "default",
    createdAt: "2025-03-09T13:17:10.100Z",
    updatedAt: "2026-02-12T10:41:33.004Z",
  },
};

function ProviderIcon({ icon: Icon }: { icon: ModuleIcon }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]">
      <Icon className="h-6 w-6" />
    </span>
  );
}

interface IIdentityDetailProps {
  label: string;
  value: string | number | undefined;
}

function IdentityDetail({ label, value }: IIdentityDetailProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[var(--workspace-brand-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm leading-6 text-[var(--workspace-brand-foreground)]">
        {value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

export const IdentityCardDefault = memo(function IdentityCardDefault(
  props: Partial<IdentityCardDefaultProps>,
) {
  const {
    identity,
    lastOperationLabel,
    onAction,
    embedded = false,
  } = {
    ...defaultIdentityCardDefaultProps,
    ...props,
  };
  const providerMeta = getIdentityProviderMeta(identity.provider);
  const actions = getIdentityActions(identity);
  const [pendingAction, setPendingAction] = useState<{
    identity: RbacIdentity;
    action: IdentityAction;
  } | null>(null);
  const [localResult, setLocalResult] = useState<string>();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const operationLabel = lastOperationLabel ?? localResult;

  return (
    <article
      ref={setPortalContainer}
      className={
        embedded
          ? "min-w-0 py-6 first:pt-0 last:pb-0"
          : "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6"
      }
      data-ds-block="rbac.identity.card-default"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 flex-[1_1_18rem] items-start gap-3">
          <ProviderIcon icon={providerMeta.icon} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-[var(--workspace-brand-foreground)]">
                {providerMeta.title}
              </h3>
              <span className="rounded-full border border-[var(--workspace-brand-line)] px-2.5 py-1 text-xs text-[var(--workspace-brand-muted)]">
                {providerMeta.kindLabel}
              </span>
            </div>
            <p className="mt-1 break-all text-base leading-6 text-[var(--workspace-brand-muted)]">
              {getIdentityPrimaryLogin(identity)}
            </p>
          </div>
        </div>
        <div className="flex max-w-full flex-wrap gap-2 lg:max-w-lg lg:justify-end">
          {actions.map((action) => (
            <Button
              variant={action.tone === "danger" ? "danger" : "secondary"}
              key={action.key}
              onClick={() => {
                if (action.tone === "danger") {
                  setPendingAction({ identity, action });
                  return;
                }
                onAction?.(identity, action);
              }}
              type="button"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      {operationLabel ? (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 text-sm text-[var(--workspace-brand-foreground)]"
        >
          <Check className="h-5 w-5 shrink-0 text-[var(--workspace-brand-foreground)]" />
          {operationLabel}
        </p>
      ) : null}
      <details className="group mt-4 rounded-2xl p-1 open:bg-[var(--workspace-brand-background)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium text-[var(--workspace-brand-muted)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] [&::-webkit-details-marker]:hidden">
          <span>Account details</span>
          <ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="mx-3 mt-2 border-t border-[var(--workspace-brand-line)] pb-3 pt-4">
          <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <IdentityDetail label="Identity ID" value={identity.id} />
            <IdentityDetail label="Provider key" value={identity.provider} />
            <IdentityDetail label="Email" value={identity.email} />
            <IdentityDetail label="Account" value={identity.account} />
            <IdentityDetail label="Variant" value={identity.variant} />
            <IdentityDetail
              label="Created"
              value={formatRbacDateTime(identity.createdAt)}
            />
            <IdentityDetail
              label="Updated"
              value={formatRbacDateTime(identity.updatedAt)}
            />
          </dl>
        </div>
      </details>
      <ConfirmationDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title="Remove identity?"
        description={
          pendingAction
            ? `Remove ${getIdentityProviderMeta(pendingAction.identity.provider).title} — ${getIdentityPrimaryLogin(pendingAction.identity)} from this account? Confirmation records a local removal request in this preview; no server data is deleted.`
            : "Confirm removal of this sign-in method."
        }
        confirmLabel={pendingAction?.action.label ?? "Remove identity"}
        onConfirm={() => {
          if (!pendingAction) return;
          onAction?.(pendingAction.identity, pendingAction.action);
          if (!onAction)
            setLocalResult("Identity removal requested in this preview.");
          setPendingAction(null);
        }}
        portalContainer={portalContainer}
      />
    </article>
  );
});
