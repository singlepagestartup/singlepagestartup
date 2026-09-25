import { CheckCircle2, type LucideIcon } from "lucide-react";

export const defaultFeatureStatusDefaultProps = {
  icon: CheckCircle2 as LucideIcon,
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

  const rootClassName = [
    "rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      data-ds-block="website-builder.feature.status-default"
      data-ds-layer="singlepage"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <small className="block text-xs text-slate-500">{label}</small>
          <strong className="block text-sm font-medium text-slate-900">
            {value}
          </strong>
        </span>
      </div>
    </div>
  );
}
