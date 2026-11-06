import type { IComponentProps, FeatureTestimotionalProps } from "./interface";
export type { FeatureTestimotionalProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMergePresentation, twMerge } from "tailwind-merge";

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
            className={twMergePresentation("h-5 w-5", className)}
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

export function FeatureTestimotional(props?: IComponentProps) {
  const { avatar, name, role, text, rating, className } = {
    ...defaultFeatureTestimotionalProps,
    ...props,
  };
  const rootClassName = twMerge(
    "flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-6 sm:p-8",
    className,
  );
  const visibleRating = Number.isNaN(rating)
    ? 0
    : Math.max(0, Math.min(5, Math.floor(rating)));
  return (
    <article
      className={rootClassName}
      data-ds-block="website-builder.feature.testimotional"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "testimotional"}
    >
      <div
        className="mb-6 flex gap-1"
        role="img"
        aria-label={`${visibleRating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const RatingStar = index < visibleRating ? StarFilled : Star;
          return (
            <RatingStar
              className={`h-5 w-5 ${index < visibleRating ? "text-primary" : "text-muted-foreground"}`}
              key={index}
            />
          );
        })}
      </div>
      <blockquote className="flex-1 text-lg leading-8 text-foreground">
        "{text}"
      </blockquote>
      <footer className="mt-8 flex min-w-0 items-center gap-3 border-t border-border pt-5">
        <img
          className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
          src={avatar}
          alt={name}
        />
        <span className="min-w-0">
          <strong className="block text-sm font-semibold leading-6 text-foreground">
            {name}
          </strong>
          <small className="block text-sm leading-6 text-muted-foreground">
            {role}
          </small>
        </span>
      </footer>
    </article>
  );
}
/** Official Phosphor Fill geometry for filled rating values. */
export const StarFilled = forwardRef<SVGSVGElement, IModuleIconProps>(
  function StarFilled({ className, size = 20, children, ...props }, ref) {
    return (
      <SharedIcon
        variant="custom"
        name="star-fill"
        size={size}
        className={twMergePresentation("h-5 w-5 shrink-0", className)}
        svgProps={{ ...props, ref }}
      />
    );
  },
);
const Star = createIcon("star");
const avatarUrl =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultFeatureTestimotionalProps = {
  avatar: avatarUrl,
  name: "James Carter",
  role: "CTO, TechFlow",
  text: "The modular architecture saved us months of development. We shipped our MVP with ecommerce and blog fully integrated in just two weeks.",
  rating: 5,
  className: "",
};
