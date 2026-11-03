import type { IComponentProps, IProfileOverviewProps } from "./interface";
export type { IProfileOverviewProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component(props: IComponentProps = {}) {
  const { name, role, avatar, location, joinedYear, website, socials } = {
    ...defaultProfileOverviewProps,
    ...props,
  };
  return (
    <div
      className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[minmax(240px,0.7fr)_minmax(0,1fr)]"
      data-ds-block="social.profile.overview-default"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="profile"
      data-variant={props.variant ?? "overview-default"}
    >
      <div className="aspect-square bg-muted">
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
        <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
          <span className="min-w-0">{name}</span>
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon name="check" size={20} className="text-foreground" />
            <span className="sr-only">Verified</span>
          </span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{role}</p>

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-5 w-5" />
              {location}
            </span>
          )}
          {joinedYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-5 w-5" />
              Joined {joinedYear}
            </span>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
            >
              <ExternalLink className="h-5 w-5" />
              {website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* Social links */}
        <div className="mt-8 flex flex-wrap gap-2">
          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
              Twitter
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn
            </a>
          )}
          {socials.github && (
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
const Twitter = createIcon("twitter-logo");
const MapPin = createIcon("map-pin");
const Linkedin = createIcon("linkedin-logo");
const Github = createIcon("github-logo");
const ExternalLink = createIcon("arrow-square-out");
const Calendar = createIcon("calendar-blank");
const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultProfileOverviewProps: IProfileOverviewProps = {
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
