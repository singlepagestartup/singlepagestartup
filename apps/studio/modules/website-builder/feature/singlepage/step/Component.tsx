import type { IComponentProps } from "./interface";
import { memo } from "react";

export const Component = memo<IComponentProps>(function Component({
  title,
  subtitle,
  description,
  children,
  appearance = "default",
}) {
  return (
    <li
      className="min-w-0 border-t border-default-foreground/20 pt-5"
      data-module="website-builder"
      data-model="feature"
      data-variant="step"
      data-ds-block="website-builder.feature.step"
    >
      <span
        className={`${appearance === "prominent" ? "text-4xl" : "text-sm"} font-medium text-primary`}
      >
        {subtitle}
      </span>
      <h3
        className={`${appearance === "prominent" ? "mt-5 text-lg" : "mt-3 text-base"} font-semibold`}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-default-muted-foreground">
        {description}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </li>
  );
});
