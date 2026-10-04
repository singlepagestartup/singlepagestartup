export const defaultFeatureBadgeDefaultProps = {
  label: "v2.0 - Now with 15 modules",
};

export type FeatureBadgeDefaultProps = typeof defaultFeatureBadgeDefaultProps;

export function FeatureBadgeDefault(props?: Partial<FeatureBadgeDefaultProps>) {
  const { label } = { ...defaultFeatureBadgeDefaultProps, ...props };

  return (
    <div
      className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-1 text-xs font-medium leading-5 text-[var(--workspace-brand-foreground)]"
      data-ds-block="website-builder.feature.badge-default"
      data-ds-layer="singlepage"
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--workspace-brand-accent)]"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
