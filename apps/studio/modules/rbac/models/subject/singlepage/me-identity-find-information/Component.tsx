import { useCallback, useMemo, useState } from "react";

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
    title: "Sign-in methods",
    description: "Manage each connected account and the ways you sign in.",
    emptyLabel: "No sign-in methods connected to this account.",
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

  const handleAction = useCallback(
    (identity: RbacIdentity, action: IdentityAction) => {
      setLastOperation({
        identityId: identity.id,
        label: getIdentityOperationLabel(action.key),
      });
    },
    [],
  );

  return (
    <article
      className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
      data-ds-block="rbac.subject.me-identity-find-information"
      data-ds-imports="rbac.identity.card-default"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--workspace-brand-foreground)]">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {description}
          </p>
        </div>
        <span className="inline-flex min-h-7 shrink-0 items-center rounded-full border border-[var(--workspace-brand-line)] px-3 text-xs font-medium text-[var(--workspace-brand-muted)]">
          {
            sortedRelations.filter((relation) =>
              identities.some(
                (identity) => identity.id === relation.identityId,
              ),
            ).length
          }{" "}
          connected
        </span>
      </div>

      <div className="mt-6 divide-y divide-[var(--workspace-brand-line)]">
        {sortedRelations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6 text-center text-sm text-[var(--workspace-brand-muted)]">
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
                embedded
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
