export const defaultFeatureBadgeDefaultProps = {
  label: "v2.0 - Now with 15 modules",
};

export type FeatureBadgeDefaultProps = typeof defaultFeatureBadgeDefaultProps;

export function FeatureBadgeDefault(props?: Partial<FeatureBadgeDefaultProps>) {
  const { label } = { ...defaultFeatureBadgeDefaultProps, ...props };

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
      data-ds-block="website-builder.feature.badge-default"
      data-ds-layer="singlepage"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      {label}
    </div>
  );
}
