import { SubjectMeProfileInformation } from "../me-profile-information/Component";
import { defaultRbacProfiles, type RbacAccountProfile } from "../../../shared";

export interface SubjectMeSocialModuleProfileFindInformationProps {
  title: string;
  description: string;
  profiles: RbacAccountProfile[];
}

export const defaultSubjectMeSocialModuleProfileFindInformationProps: SubjectMeSocialModuleProfileFindInformationProps =
  {
    title: "Profile",
    description:
      "Edit the name, headline and information on your public profile.",
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
    <section
      className="min-w-0 space-y-6"
      data-ds-block="rbac.subject.me-social-module-profile-find-information"
      data-ds-imports="rbac.subject.me-profile-information"
      data-ds-layer="singlepage"
    >
      {profiles.length ? (
        profiles.map((profile) => (
          <SubjectMeProfileInformation
            key={profile.id}
            profile={profile}
            profiles={profiles}
            title={profiles.length > 1 ? profile.title : title}
            description={description}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
            No public profile is connected.
          </p>
        </div>
      )}
    </section>
  );
}
