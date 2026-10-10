import { ChevronRight } from "../../../../../workspace/utils/components/ModuleIcons";

import {
  Component as ProfileOverview,
  type IProfileOverviewProps as ProfileOverviewProps,
  defaultProfileOverviewProps,
} from "../overview/default/index";

export const defaultProfileAuthorProps = {
  slug: "sarah-kim",
  ...defaultProfileOverviewProps,
};

export type ProfileAuthorProps = ProfileOverviewProps & {
  slug: string;
};

export function ProfileAuthor(props?: Partial<ProfileAuthorProps>) {
  const profile = { ...defaultProfileAuthorProps, ...props };

  return (
    <section
      className="bg-[var(--workspace-brand-background)]"
      data-ds-block="social.profile.author"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--workspace-brand-muted)]">
          <a
            href="/"
            className="transition hover:text-[var(--workspace-brand-muted)]"
          >
            Home
          </a>
          <ChevronRight className="h-5 w-5" />
          <a
            href="/blog"
            className="transition hover:text-[var(--workspace-brand-muted)]"
          >
            Blog
          </a>
          <ChevronRight className="h-5 w-5" />
          <span className="text-[var(--workspace-brand-muted)]">
            {profile.name}
          </span>
        </nav>

        <ProfileOverview
          name={profile.name}
          role={profile.role}
          avatar={profile.avatar}
          location={profile.location}
          joinedYear={profile.joinedYear}
          website={profile.website}
          socials={profile.socials}
        />
      </div>
    </section>
  );
}
