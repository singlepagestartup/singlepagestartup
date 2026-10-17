import type { IComponentProps, ProfileAuthorProps } from "./interface";
export type { ProfileAuthorProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  Component as ProfileOverview,
  type IProfileOverviewProps as ProfileOverviewProps,
  defaultProfileOverviewProps,
} from "../overview/default/index";
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

export function ProfileAuthor(props?: IComponentProps) {
  const profile = { ...defaultProfileAuthorProps, ...props };
  return (
    <section
      className="bg-muted"
      data-ds-block="social.profile.author"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="profile"
      data-variant={props?.variant ?? "author"}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="transition hover:text-muted-foreground">
            Home
          </a>
          <ChevronRight className="h-5 w-5" />
          <a href="/blog" className="transition hover:text-muted-foreground">
            Blog
          </a>
          <ChevronRight className="h-5 w-5" />
          <span className="text-muted-foreground">{profile.name}</span>
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
const ChevronRight = createIcon("caret-right");
export const defaultProfileAuthorProps = {
  slug: "sarah-kim",
  ...defaultProfileOverviewProps,
};
