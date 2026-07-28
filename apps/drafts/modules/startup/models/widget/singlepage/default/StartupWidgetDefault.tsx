export interface StartupWidgetDefaultProps {
  label?: string;
  title: string;
  description: string;
  metrics?: Array<{
    label: string;
    value: string;
  }>;
}

export const startupWidgetDefaultProps: StartupWidgetDefaultProps = {
  label: "Startup module",
  title: "A startup workspace assembled from reusable SPS blocks.",
  description:
    "This block represents the startup module surface in the draft system, separate from the startup layer override concept.",
  metrics: [
    {
      label: "Draft blocks",
      value: "12",
    },
    {
      label: "Page variants",
      value: "4",
    },
    {
      label: "Figma sync",
      value: "Ready",
    },
  ],
};

export function StartupWidgetDefault({
  label = startupWidgetDefaultProps.label,
  title,
  description,
  metrics = startupWidgetDefaultProps.metrics,
}: StartupWidgetDefaultProps) {
  return (
    <div
      className="w-full bg-white py-20"
      data-ds-block="startup.widget.default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:px-0">
        <div className="flex max-w-3xl flex-col gap-5">
          {label ? (
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">
              {label}
            </p>
          ) : null}
          <h2 className="m-0 text-4xl font-semibold leading-tight tracking-normal text-slate-950 lg:text-5xl">
            {title}
          </h2>
          <p className="m-0 text-base leading-7 text-slate-600">
            {description}
          </p>
        </div>
        {metrics?.length ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                key={metric.label}
              >
                <strong className="block text-2xl font-semibold text-slate-950">
                  {metric.value}
                </strong>
                <span className="mt-2 block text-sm text-slate-500">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
