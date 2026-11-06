import type { IComponentProps, FeatureBadgeDefaultProps } from "./interface";
export type { FeatureBadgeDefaultProps } from "./interface";
export const defaultFeatureBadgeDefaultProps = {
  label: "v2.0 - Now with 15 modules",
};

export function FeatureBadgeDefault(props?: IComponentProps) {
  const { label } = { ...defaultFeatureBadgeDefaultProps, ...props };

  return (
    <div
      className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium leading-5 text-foreground"
      data-ds-block="website-builder.feature.badge-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "badge-default"}
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary text-primary-foreground"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
