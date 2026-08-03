import { Star } from "lucide-react";

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
  const rootClassName = [
    "rounded-xl border border-slate-200 bg-[#eaf0f7] p-6",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={rootClassName}
      data-ds-block="website-builder.feature.testimotional"
      data-ds-layer="singlepage"
    >
      <div className="mb-3 flex gap-0.5" aria-label={`${rating} stars`}>
        {Array.from({ length: rating }).map((_, index) => (
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" key={index} />
        ))}
      </div>
      <p className="text-sm text-slate-700">"{text}"</p>
      <footer className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
        <img
          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          src={avatar}
          alt={name}
        />
        <span>
          <strong className="block text-sm font-medium text-slate-900">
            {name}
          </strong>
          <small className="block text-xs text-slate-500">{role}</small>
        </span>
      </footer>
    </article>
  );
}
