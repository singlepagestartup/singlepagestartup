import {
  Database,
  Layers,
  TrendingUp,
  Users,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

const iconBoxClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]";

interface StatItem {
  value: string;
  label: string;
  icon: ModuleIcon;
  description?: string;
}

export const defaultContentFeatureFindDefaultProps = {
  stats: [
    {
      value: "15",
      label: "Modules",
      icon: Layers,
      description: "Reusable business functions.",
    },
    {
      value: "50+",
      label: "Models",
      icon: Database,
      description: "Records and their relationships.",
    },
    {
      value: "99.9%",
      label: "Uptime",
      icon: TrendingUp,
      description: "Illustrative availability figure.",
    },
    {
      value: "24/7",
      label: "Support",
      icon: Users,
      description: "Illustrative support schedule.",
    },
  ] satisfies StatItem[],
};

export interface ContentFeatureFindDefaultProps {
  stats: StatItem[];
}

export function ContentFeatureFindDefault(
  props?: Partial<ContentFeatureFindDefaultProps>,
) {
  const { stats } = { ...defaultContentFeatureFindDefaultProps, ...props };

  return (
    <div
      className="w-full bg-[var(--workspace-brand-background)] py-4 sm:py-6"
      data-ds-block="website-builder.widget.content-feature-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div
            className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6"
            key={stat.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block break-words text-3xl font-semibold leading-tight tracking-normal text-[var(--workspace-brand-foreground)] sm:text-4xl">
                  {stat.value}
                </strong>
                <span className="mt-2 block text-sm font-semibold leading-6 text-[var(--workspace-brand-foreground)]">
                  {stat.label}
                </span>
              </div>
              <span className={iconBoxClass}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            {stat.description ? (
              <p className="mt-4 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                {stat.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
