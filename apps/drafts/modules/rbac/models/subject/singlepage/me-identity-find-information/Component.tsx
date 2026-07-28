import { useMemo, useState } from "react";

import { IdentityCardDefault } from "../../../identity/singlepage/card-default/Component";
import {
  defaultRbacIdentities,
  defaultRbacSubjectToIdentities,
  getIdentityOperationLabel,
  type IdentityAction,
  type RbacIdentity,
  type RbacSubjectToIdentity,
} from "../../../../shared";

export interface SubjectMeIdentityFindInformationProps {
  title: string;
  description: string;
  emptyLabel: string;
  identities: RbacIdentity[];
  relations: RbacSubjectToIdentity[];
}

export const defaultSubjectMeIdentityFindInformationProps: SubjectMeIdentityFindInformationProps =
  {
    title: "Identities",
    description:
      "Each identity is an independent login method. Actions differ by provider type.",
    emptyLabel: "No identities linked to this subject.",
    identities: defaultRbacIdentities,
    relations: defaultRbacSubjectToIdentities,
  };

export function SubjectMeIdentityFindInformation(
  props?: Partial<SubjectMeIdentityFindInformationProps>,
) {
  const { title, description, emptyLabel, identities, relations } = {
    ...defaultSubjectMeIdentityFindInformationProps,
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
    <article
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-ds-block="rbac.subject.me-identity-find-information"
      data-ds-imports="rbac.identity.card-default"
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
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
    </article>
  );
}
