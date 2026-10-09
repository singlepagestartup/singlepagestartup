import { twMerge } from "tailwind-merge";
import {
  Check,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

export const defaultFeatureStatusDefaultProps = {
  icon: Check as ModuleIcon,
  label: "Status",
  value: "All systems operational",
  className: "",
};

export type FeatureStatusDefaultProps = typeof defaultFeatureStatusDefaultProps;

export function FeatureStatusDefault(
  props?: Partial<FeatureStatusDefaultProps>,
) {
  const {
    icon: Icon,
    label,
    value,
    className,
  } = {
    ...defaultFeatureStatusDefaultProps,
    ...props,
  };

  const rootClassName = twMerge(
    "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5",
    className,
  );

  return (
    <div
      className={rootClassName}
      data-ds-block="website-builder.feature.status-default"
      data-ds-layer="singlepage"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <small className="block text-xs text-[var(--workspace-brand-muted)]">
            {label}
          </small>
          <strong className="block text-sm font-semibold leading-6 text-[var(--workspace-brand-foreground)]">
            {value}
          </strong>
        </span>
      </div>
    </div>
  );
}
