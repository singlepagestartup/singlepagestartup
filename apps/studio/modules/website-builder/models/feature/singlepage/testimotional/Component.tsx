import { twMerge } from "tailwind-merge";
import {
  Star,
  StarFilled,
} from "../../../../../../workspace/utils/components/ModuleIcons";

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

export type FeatureTestimotionalProps = typeof defaultFeatureTestimotionalProps;

export function FeatureTestimotional(
  props?: Partial<FeatureTestimotionalProps>,
) {
  const { avatar, name, role, text, rating, className } = {
    ...defaultFeatureTestimotionalProps,
    ...props,
  };
  const rootClassName = twMerge(
    "flex h-full min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 sm:p-8",
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
              className={`h-5 w-5 ${index < visibleRating ? "text-[var(--workspace-brand-accent)]" : "text-[var(--workspace-brand-muted)]"}`}
              key={index}
            />
          );
        })}
      </div>
      <blockquote className="flex-1 text-lg leading-8 text-[var(--workspace-brand-foreground)]">
        "{text}"
      </blockquote>
      <footer className="mt-8 flex min-w-0 items-center gap-3 border-t border-[var(--workspace-brand-line)] pt-5">
        <img
          className="h-12 w-12 shrink-0 rounded-full border border-[var(--workspace-brand-line)] object-cover"
          src={avatar}
          alt={name}
        />
        <span className="min-w-0">
          <strong className="block text-sm font-semibold leading-6 text-[var(--workspace-brand-foreground)]">
            {name}
          </strong>
          <small className="block text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {role}
          </small>
        </span>
      </footer>
    </article>
  );
}
