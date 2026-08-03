import { ChevronRight } from "lucide-react";

import {
  ProfileOverview,
  type ProfileOverviewProps,
  defaultProfileOverviewProps,
} from "../overview/ProfileOverview";

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
      className="relative border-b border-slate-200 bg-white"
      data-ds-block="social.profile.author"
      data-ds-layer="singlepage"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-slate-100/60" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-slate-100/40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
          <a href="/" className="transition hover:text-slate-600">
            Home
          </a>
          <ChevronRight className="h-3 w-3" />
          <a href="/blog" className="transition hover:text-slate-600">
            Blog
          </a>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">{profile.name}</span>
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
