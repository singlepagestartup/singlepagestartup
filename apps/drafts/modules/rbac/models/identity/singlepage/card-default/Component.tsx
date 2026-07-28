import { CheckCircle2, type LucideIcon } from "lucide-react";

import {
  formatRbacDateTime,
  getIdentityActions,
  getIdentityPrimaryLogin,
  getIdentityProviderMeta,
  type IdentityAction,
  type RbacIdentity,
  type RbacSubjectToIdentity,
} from "../../../../shared";

export interface IdentityCardDefaultProps {
  identity: RbacIdentity;
  relation?: RbacSubjectToIdentity;
  lastOperationLabel?: string;
  onAction?: (identity: RbacIdentity, action: IdentityAction) => void;
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
  relation: {
    id: "b887f4ef-fca1-46cc-9f39-c988f9b0b3d5",
    subjectId: "973e0fde-4786-413e-bc8f-2eecf4488e9d",
    identityId: "f3b3934d-3199-4f04-9e8e-99c4ab0a47a1",
    orderIndex: 0,
    variant: "default",
  },
};

function ProviderIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function IdentityCardDefault(props?: Partial<IdentityCardDefaultProps>) {
  const { identity, relation, lastOperationLabel, onAction } = {
    ...defaultIdentityCardDefaultProps,
    ...props,
  };
  const providerMeta = getIdentityProviderMeta(identity.provider);
  const actions = getIdentityActions(identity);

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-ds-block="rbac.identity.card-default"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <ProviderIcon icon={providerMeta.icon} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-medium text-slate-900">
                {providerMeta.title}
              </h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                {providerMeta.kindLabel}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              {providerMeta.description}
            </p>
          </div>
        </div>

        {lastOperationLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {lastOperationLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
        <div className="min-w-0">
          <span className="block text-slate-500">Identity ID</span>
          <code className="mt-1 block truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-900">
            {identity.id}
          </code>
        </div>
        <div className="min-w-0">
          <span className="block text-slate-500">Login</span>
          <p className="mt-1 break-all text-slate-900">
            {getIdentityPrimaryLogin(identity)}
          </p>
        </div>
        <div className="min-w-0">
          <span className="block text-slate-500">Provider Key</span>
          <p className="mt-1 font-mono text-xs text-slate-900">
            {identity.provider}
          </p>
        </div>
        <div className="min-w-0">
          <span className="block text-slate-500">Relation ID</span>
          <code className="mt-1 block truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-900">
            {relation?.id ?? "-"}
          </code>
        </div>
        <div>
          <span className="block text-slate-500">Updated</span>
          <p className="mt-1 text-slate-900">
            {formatRbacDateTime(identity.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => {
          const isDanger = action.tone === "danger";

          return (
            <button
              className={
                isDanger
                  ? "inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100"
                  : "inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              }
              key={action.key}
              onClick={() => onAction?.(identity, action)}
              type="button"
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}
