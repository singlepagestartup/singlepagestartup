import { Layers, type LucideIcon } from "lucide-react";

export const defaultFeatureListItemDefaultProps = {
  icon: Layers as LucideIcon,
  label: "Modular architecture",
  className: "",
};

export type FeatureListItemDefaultProps =
  typeof defaultFeatureListItemDefaultProps;

export function FeatureListItemDefault(
  props?: Partial<FeatureListItemDefaultProps>,
) {
  const {
    icon: Icon,
    label,
    className,
  } = {
    ...defaultFeatureListItemDefaultProps,
    ...props,
  };

  const rootClassName = [
    "flex items-center gap-2 text-sm text-slate-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={rootClassName}
      data-ds-block="website-builder.feature.list-item-default"
      data-ds-layer="singlepage"
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span>{label}</span>
    </span>
  );
}
