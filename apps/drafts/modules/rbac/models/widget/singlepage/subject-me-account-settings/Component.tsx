import { LogOut } from "lucide-react";

import { SubjectMeDelete } from "../../../subject/singlepage/me-delete/Component";
import { SubjectMeIdentityFindInformation } from "../../../subject/singlepage/me-identity-find-information/Component";
import { SubjectMeInformation } from "../../../subject/singlepage/me-information/Component";
import { SubjectMeProfileInformation } from "../../../subject/singlepage/me-profile-information/Component";
import { SubjectMeSocialModuleProfileFindInformation } from "../../../subject/singlepage/me-social-module-profile-find-information/Component";
import {
  defaultRbacIdentities,
  defaultRbacProfiles,
  defaultRbacSubject,
  defaultRbacSubjectToIdentities,
  defaultRbacUser,
  type RbacAccountProfile,
  type RbacAccountUser,
  type RbacIdentity,
  type RbacSubject,
  type RbacSubjectToIdentity,
} from "../../../../shared";

export interface SubjectMeAccountSettingsProps {
  subject: RbacSubject;
  user: RbacAccountUser;
  identities: RbacIdentity[];
  identityRelations: RbacSubjectToIdentity[];
  profiles: RbacAccountProfile[];
  eyebrow: string;
  title: string;
  description: string;
  logoutLabel: string;
}

export const defaultSubjectMeAccountSettingsProps: SubjectMeAccountSettingsProps =
  {
    subject: defaultRbacSubject,
    user: defaultRbacUser,
    identities: defaultRbacIdentities,
    identityRelations: defaultRbacSubjectToIdentities,
    profiles: defaultRbacProfiles,
    eyebrow: "RBAC account",
    title: "Account Settings",
    description:
      "Manage the RBAC subject, linked identities, public profiles, and account actions.",
    logoutLabel: "Log out",
  };

export function SubjectMeAccountSettings(
  props?: Partial<SubjectMeAccountSettingsProps>,
) {
  const {
    subject,
    user,
    identities,
    identityRelations,
    profiles,
    eyebrow,
    title,
    description,
    logoutLabel,
  } = { ...defaultSubjectMeAccountSettingsProps, ...props };

  return (
    <section
      className="w-full bg-slate-50 py-10"
      data-ds-block="rbac.widget.subject-me-account-settings"
      data-ds-imports="rbac.subject.me-information rbac.subject.me-identity-find-information rbac.subject.me-social-module-profile-find-information rbac.subject.me-profile-information rbac.subject.me-delete"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {logoutLabel}
          </button>
        </div>

        <div className="space-y-5">
          <SubjectMeInformation subject={subject} />
          <SubjectMeIdentityFindInformation
            identities={identities}
            relations={identityRelations}
          />
          <SubjectMeSocialModuleProfileFindInformation profiles={profiles} />
          <SubjectMeProfileInformation user={user} />
          <SubjectMeDelete />
        </div>
      </div>
    </section>
  );
}
