import { ExternalLink, User } from "lucide-react";

import {
  defaultRbacProfiles,
  type RbacAccountProfile,
} from "../../../../shared";

export interface SubjectMeSocialModuleProfileFindInformationProps {
  title: string;
  description: string;
  profiles: RbacAccountProfile[];
}

export const defaultSubjectMeSocialModuleProfileFindInformationProps: SubjectMeSocialModuleProfileFindInformationProps =
  {
    title: "Public Profiles",
    description:
      "Public-facing profile records live in the social module and are connected to this RBAC subject.",
    profiles: defaultRbacProfiles,
  };

export function SubjectMeSocialModuleProfileFindInformation(
  props?: Partial<SubjectMeSocialModuleProfileFindInformationProps>,
) {
  const { title, description, profiles } = {
    ...defaultSubjectMeSocialModuleProfileFindInformationProps,
    ...props,
  };

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-ds-block="rbac.subject.me-social-module-profile-find-information"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
            <User className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-xl font-medium text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {profiles.map((profile) => (
          <article
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            key={profile.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-slate-900">
                  {profile.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {profile.subtitle}
                </p>
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-100"
                href={`/admin/social/profile/${profile.id}`}
              >
                <ExternalLink className="h-4 w-4" />
                Open profile
              </a>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MetadataValue label="Profile ID" mono value={profile.id} />
              <MetadataValue label="Slug" value={profile.slug} />
              <MetadataValue
                label="Relation ID"
                mono
                value={profile.relationId}
              />
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

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
        <code className="mt-1 block truncate rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-900">
          {value}
        </code>
      ) : (
        <p className="mt-1 truncate text-sm text-slate-900">{value}</p>
      )}
    </div>
  );
}
