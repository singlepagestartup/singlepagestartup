import { Shield } from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  defaultRbacSubject,
  formatRbacDateTime,
  type RbacSubject,
} from "../../../../shared";

export interface SubjectMeInformationProps {
  subject: RbacSubject;
  title: string;
  description: string;
}

export const defaultSubjectMeInformationProps: SubjectMeInformationProps = {
  subject: defaultRbacSubject,
  title: "Account details",
  description: "Identifiers and dates for your account.",
};

function MetadataValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-xs text-[var(--workspace-brand-muted)]">
        {label}
      </span>
      {mono ? (
        <code className="mt-1 block break-all rounded-lg border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-2 font-[family-name:var(--workspace-brand-font-body)] text-xs text-[var(--workspace-brand-foreground)]">
          {value}
        </code>
      ) : (
        <p className="mt-1 break-words text-sm text-[var(--workspace-brand-foreground)]">
          {value}
        </p>
      )}
    </div>
  );
}

export function SubjectMeInformation(
  props?: Partial<SubjectMeInformationProps>,
) {
  const { subject, title, description } = {
    ...defaultSubjectMeInformationProps,
    ...props,
  };

  return (
    <article
      className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6"
      data-ds-block="rbac.subject.me-information"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-muted)]">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-xl font-semibold text-[var(--workspace-brand-foreground)]">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 border-t border-[var(--workspace-brand-line)] pt-6 sm:grid-cols-2">
        <MetadataValue label="Subject ID" mono value={subject.id} />
        <MetadataValue label="Slug" value={subject.slug} />
        <MetadataValue label="Variant" value={subject.variant} />
        <MetadataValue
          label="Created"
          value={formatRbacDateTime(subject.createdAt)}
        />
        <MetadataValue
          label="Updated"
          value={formatRbacDateTime(subject.updatedAt)}
        />
      </div>
    </article>
  );
}
