import { useId, useState } from "react";
import {
  Button,
  Select,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { LogOut } from "../../../../../../workspace/utils/components/ModuleIcons";

import { SubjectMeDelete } from "../../../subject/singlepage/me-delete/Component";
import { SubjectMeIdentityFindInformation } from "../../../subject/singlepage/me-identity-find-information/Component";
import { SubjectMeSocialModuleProfileFindInformation } from "../../../subject/singlepage/me-social-module-profile-find-information/Component";
import {
  defaultSettingsIdentities,
  defaultRbacProfiles,
  defaultSettingsSubject,
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
    subject: defaultSettingsSubject,
    user: defaultRbacUser,
    identities: defaultSettingsIdentities,
    identityRelations: defaultRbacSubjectToIdentities,
    profiles: defaultRbacProfiles,
    eyebrow: "RBAC account",
    title: "Settings",
    description: "Edit your public profile and manage how you sign in.",
    logoutLabel: "Log out",
  };

export function SubjectMeAccountSettings(
  props?: Partial<SubjectMeAccountSettingsProps>,
) {
  const {
    subject,
    identities,
    identityRelations,
    profiles,
    title,
    description,
    logoutLabel,
  } = { ...defaultSubjectMeAccountSettingsProps, ...props };

  const [activeSection, setActiveSection] = useState("profile");
  const navigationId = useId();
  const sections = [
    {
      id: "profile",
      label: "Profile",
      content: (
        <div className="space-y-6">
          <SubjectMeSocialModuleProfileFindInformation profiles={profiles} />
          <SubjectMeDelete title="Delete account" subject={subject} />
        </div>
      ),
    },
    {
      id: "sign-in",
      label: "Sign-in methods",
      content: (
        <SubjectMeIdentityFindInformation
          identities={identities}
          relations={identityRelations}
        />
      ),
    },
  ];

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-6 sm:py-8"
      data-ds-block="rbac.widget.subject-me-account-settings"
      data-ds-imports="rbac.subject.me-identity-find-information rbac.subject.me-social-module-profile-find-information rbac.subject.me-delete"
      data-ds-layer="singlepage"
      data-subject-id={subject.id}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)] md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-[26px] text-[var(--workspace-brand-muted)]">
              {description}
            </p>
          </div>
          <Button variant="secondary" type="button">
            <LogOut className="h-5 w-5" />
            {logoutLabel}
          </Button>
        </header>
        <div className="grid min-w-0 items-start gap-6 md:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
          <div className="min-w-0 md:hidden">
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor={`${navigationId}-select`}
            >
              Settings section
            </label>
            <Select
              id={`${navigationId}-select`}
              aria-label="Settings section"
              value={activeSection}
              onValueChange={setActiveSection}
              options={sections.map(({ id, label }) => ({ value: id, label }))}
            />
          </div>
          <nav
            aria-label="Settings"
            className="sticky top-24 hidden space-y-1 md:block"
          >
            {sections.map(({ id, label }) => (
              <button
                key={id}
                id={`${navigationId}-nav-${id}`}
                aria-controls={`${navigationId}-panel-${id}`}
                aria-current={activeSection === id ? "page" : undefined}
                onClick={() => setActiveSection(id)}
                type="button"
                className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${activeSection === id ? "bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]" : "text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-surface)]"}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-5 w-1 shrink-0 rounded-full ${activeSection === id ? "bg-[var(--workspace-brand-accent)]" : "bg-transparent"}`}
                />
                {label}
              </button>
            ))}
          </nav>
          <div className="min-w-0">
            {sections.map(({ id, label, content }) => (
              <div
                key={id}
                id={`${navigationId}-panel-${id}`}
                role="region"
                aria-label={label}
                hidden={activeSection !== id}
                className="min-w-0"
              >
                {content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
