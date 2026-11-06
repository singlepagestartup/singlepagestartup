import type { IComponentProps, StartupWidgetDefaultProps } from "./interface";
export type { StartupWidgetDefaultProps } from "./interface";

export function StartupWidgetDefault({
  variant = "default",
  title,
  subtitle,
  description,
  className = "",
}: IComponentProps) {
  return (
    <section
      className={`w-full rounded-2xl border border-border bg-card p-6 sm:p-10 ${className}`}
      data-ds-block="startup.widget.default"
      data-ds-layer="singlepage"
      data-module="startup"
      data-model="widget"
      data-variant={variant}
    >
      {subtitle ? (
        <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </section>
  );
}
