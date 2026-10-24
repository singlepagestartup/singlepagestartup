import type { IComponentProps } from "./interface";
import { memo } from "react";

export const Component = memo<IComponentProps>(function Component({
  title,
  subtitle,
  description,
}) {
  return (
    <li
      className="min-w-0 border-t border-default-foreground/20 pt-5"
      data-module="website-builder"
      data-model="feature"
      data-variant="step"
      data-ds-block="website-builder.feature.step"
    >
      <span className="text-sm font-medium text-primary">{subtitle}</span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-default-muted-foreground">
        {description}
      </p>
    </li>
  );
});
