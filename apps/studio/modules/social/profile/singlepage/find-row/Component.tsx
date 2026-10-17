import type { IComponentProps, ProfileFindRowProps } from "./interface";
export type { ProfileFindRowProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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

export function ProfileFindRow(props?: IComponentProps) {
  const { name, role, avatar, href, target, meta } = {
    ...defaultProfileFindRowProps,
    ...props,
  };
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-border hover:bg-muted"
      data-ds-block="social.profile.find-row"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="profile"
      data-variant={props?.variant ?? "find-row"}
    >
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground group-hover:text-foreground">
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{role}</p>
        {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
      </div>
      <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-muted-foreground" />
    </a>
  );
}
const ArrowUpRight = createIcon("arrow-up-right");
const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultProfileFindRowProps: ProfileFindRowProps = {
  name: "James Carter",
  role: "CTO",
  avatar: jamesAvatar,
  href: "/blog/authors/james-carter",
  meta: "2 articles",
};
