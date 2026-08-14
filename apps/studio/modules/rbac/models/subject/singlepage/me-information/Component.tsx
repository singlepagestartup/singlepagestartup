import { Shield } from "lucide-react";

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
  title: "Subject",
  description:
    "Core RBAC account entity. Authentication and public profile data are linked through relations.",
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
      <span className="block text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {mono ? (
        <code className="mt-1 block truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-900">
          {value}
        </code>
      ) : (
        <p className="mt-1 truncate text-sm text-slate-900">{value}</p>
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
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-ds-block="rbac.subject.me-information"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-xl font-medium text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
