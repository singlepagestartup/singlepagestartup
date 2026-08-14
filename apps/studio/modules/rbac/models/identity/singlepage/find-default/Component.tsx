import { useMemo, useState } from "react";

import { IdentityCardDefault } from "../card-default/Component";
import {
  defaultRbacIdentities,
  defaultRbacSubjectToIdentities,
  getIdentityOperationLabel,
  type IdentityAction,
  type RbacIdentity,
  type RbacSubjectToIdentity,
} from "../../../../shared";

export interface IdentityFindDefaultProps {
  title: string;
  description: string;
  emptyLabel: string;
  identities: RbacIdentity[];
  relations: RbacSubjectToIdentity[];
}

export const defaultIdentityFindDefaultProps: IdentityFindDefaultProps = {
  title: "Identities",
  description:
    "Each identity is an independent login method. Actions differ by provider type.",
  emptyLabel: "No identities linked to this subject.",
  identities: defaultRbacIdentities,
  relations: defaultRbacSubjectToIdentities,
};

export function IdentityFindDefault(props?: Partial<IdentityFindDefaultProps>) {
  const { title, description, emptyLabel, identities, relations } = {
    ...defaultIdentityFindDefaultProps,
    ...props,
  };
  const [lastOperation, setLastOperation] = useState<{
    identityId: string;
    label: string;
  } | null>(null);

  const sortedRelations = useMemo(
    () => [...relations].sort((a, b) => a.orderIndex - b.orderIndex),
    [relations],
  );

  const handleAction = (identity: RbacIdentity, action: IdentityAction) => {
    setLastOperation({
      identityId: identity.id,
      label: getIdentityOperationLabel(action.key),
    });
  };

  return (
    <section
      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-5"
      data-ds-block="rbac.identity.find-default"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sortedRelations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {emptyLabel}
          </div>
        ) : (
          sortedRelations.map((relation) => {
            const identity = identities.find(
              (item) => item.id === relation.identityId,
            );

            if (!identity) return null;

            return (
              <IdentityCardDefault
                identity={identity}
                key={relation.id}
                lastOperationLabel={
                  lastOperation?.identityId === identity.id
                    ? lastOperation.label
                    : undefined
                }
                onAction={handleAction}
                relation={relation}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
