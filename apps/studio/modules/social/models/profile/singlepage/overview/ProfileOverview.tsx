/**
 * Internal profile overview helper.
 *
 * Author hero CONTENT block: avatar with emerald verified badge, name h1,
 * role, meta row (location / joined year / website), and social links
 * (Twitter / LinkedIn / GitHub). Does NOT include the section wrapper,
 * background pattern, or breadcrumb — those belong to the display component.
 *
 * Public social.profile variants compose this via import instead of
 * re-implementing the markup. This helper intentionally has no standalone
 * Storybook story, manifest, or Figma exposure.
 *
 * Source: AuthorPage.tsx hero inner block (lines 255-320).
 */

import {
  Calendar,
  ExternalLink,
  Github,
  Linkedin,
  MapPin,
  Twitter,
} from "lucide-react";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultProfileOverviewProps = {
  name: "Sarah Kim",
  role: "Head of Product",
  avatar: sarahAvatar,
  location: "San Francisco, CA",
  joinedYear: 2015,
  website: "https://sarahkim.com",
  socials: {
    twitter: "https://twitter.com/sarahkim",
    linkedin: "https://linkedin.com/in/sarahkim",
    github: "https://github.com/sarahkim",
  },
};

export type ProfileOverviewProps = typeof defaultProfileOverviewProps;

export function ProfileOverview(props?: Partial<ProfileOverviewProps>) {
  const { name, role, avatar, location, joinedYear, website, socials } = {
    ...defaultProfileOverviewProps,
    ...props,
  };

  return (
    <div
      className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
      data-ds-block="social.profile.internal-overview"
      data-ds-layer="singlepage"
    >
      {/* Avatar with verified badge */}
      <div className="relative">
        <img
          src={avatar}
          alt={name}
          className="h-28 w-28 rounded-2xl border-2 border-slate-200 object-cover shadow-sm"
        />
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
          <span className="text-[10px] text-white">&#10003;</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h1 className="text-2xl tracking-tight text-slate-900">{name}</h1>
        <p className="mt-1 text-sm text-slate-500">{role}</p>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {joinedYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {joinedYear}
            </span>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-500 transition hover:text-slate-700"
            >
              <ExternalLink className="h-3 w-3" />
              {website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* Social links */}
        <div className="mt-4 flex flex-wrap gap-2">
          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
          {socials.github && (
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
