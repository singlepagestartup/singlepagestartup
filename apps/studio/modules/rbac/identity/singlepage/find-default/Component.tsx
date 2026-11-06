import type { IComponentProps, IdentityFindDefaultProps } from "./interface";
export type { IdentityFindDefaultProps } from "./interface";
import { useCallback, useState } from "react";

import { IdentityCardDefault } from "../card-default/Component";
import {
  defaultRbacIdentities,
  getIdentityOperationLabel,
  type IdentityAction,
  type RbacIdentity,
} from "../../../shared";

export const defaultIdentityFindDefaultProps: IdentityFindDefaultProps = {
  title: "Identities",
  description:
    "Each identity is an independent login method. Actions differ by provider type.",
  emptyLabel: "No identities linked to this subject.",
  identities: defaultRbacIdentities,
};

export function IdentityFindDefault(props?: IComponentProps) {
  const { title, description, emptyLabel, identities } = {
    ...defaultIdentityFindDefaultProps,
    ...props,
  };
  const [lastOperation, setLastOperation] = useState<{
    identityId: string;
    label: string;
  } | null>(null);

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
    <section
      className="w-full rounded-3xl border border-border bg-muted p-5"
      data-ds-block="rbac.identity.find-default"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="identity"
      data-variant={props?.variant ?? "find-default"}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {identities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          identities.map((identity) => {
            return (
              <IdentityCardDefault
                identity={identity}
                key={identity.id}
                lastOperationLabel={
                  lastOperation?.identityId === identity.id
                    ? lastOperation.label
                    : undefined
                }
                onAction={handleAction}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
