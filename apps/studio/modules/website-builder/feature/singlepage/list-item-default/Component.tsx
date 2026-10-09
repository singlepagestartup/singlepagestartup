import {
  Layers,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

export const defaultFeatureListItemDefaultProps = {
  icon: Layers as ModuleIcon,
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
    "flex min-w-0 items-start gap-3 text-base leading-7 text-[var(--workspace-brand-foreground)]",
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
      <Icon className="mt-1 h-5 w-5 shrink-0 text-[var(--workspace-brand-muted)]" />
      <span>{label}</span>
    </span>
  );
}
