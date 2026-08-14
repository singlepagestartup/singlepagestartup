import {
  Database,
  Layers,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

const iconBoxClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600";

interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const defaultContentFeatureFindDefaultProps = {
  stats: [
    { value: "15", label: "Modules", icon: Layers },
    { value: "50+", label: "Models", icon: Database },
    { value: "99.9%", label: "Uptime", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: Users },
  ] satisfies StatItem[],
};

export type ContentFeatureFindDefaultProps =
  typeof defaultContentFeatureFindDefaultProps;

export function ContentFeatureFindDefault(
  props?: Partial<ContentFeatureFindDefaultProps>,
) {
  const { stats } = { ...defaultContentFeatureFindDefaultProps, ...props };

  return (
    <div
      className="w-full border-b border-slate-200 bg-white"
      data-ds-block="website-builder.widget.content-feature-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">
        {stats.map((stat) => (
          <div className="flex items-center gap-3 px-6 py-6" key={stat.label}>
            <span className={iconBoxClass}>
              <stat.icon className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-2xl font-medium text-slate-900">
                {stat.value}
              </strong>
              <small className="block text-xs text-slate-500">
                {stat.label}
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
