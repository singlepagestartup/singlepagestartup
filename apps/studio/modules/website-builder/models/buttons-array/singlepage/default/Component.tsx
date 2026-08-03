import { ArrowRight, Play, type LucideIcon } from "lucide-react";

import { ButtonLink } from "../../../button/singlepage/link/Component";
import { ButtonPrimary } from "../../../button/singlepage/primary/Component";
import { ButtonSecondary } from "../../../button/singlepage/secondary/Component";

export interface ButtonsArrayItem {
  label: string;
  href: string;
  variant: "link" | "primary" | "secondary";
  icon?: LucideIcon;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
}

export interface ButtonsArrayDefaultProps {
  ariaLabel?: string;
  buttons: ButtonsArrayItem[];
  orientation?: "horizontal" | "vertical";
  title?: string;
}

export const defaultButtonsArrayProps: ButtonsArrayDefaultProps = {
  buttons: [
    {
      label: "Open Admin Panel",
      href: "/admin",
      variant: "primary",
      icon: ArrowRight,
    },
    {
      label: "Learn More",
      href: "#features",
      variant: "secondary",
      icon: Play,
    },
  ] satisfies ButtonsArrayItem[],
};

export function ButtonsArrayDefault(props?: Partial<ButtonsArrayDefaultProps>) {
  const { ariaLabel, buttons, orientation, title } = {
    ...defaultButtonsArrayProps,
    ...props,
  };
  const layoutClass =
    orientation === "vertical"
      ? "flex flex-col items-start gap-2"
      : "flex flex-wrap items-center gap-3";

  return (
    <div
      aria-label={ariaLabel}
      className={layoutClass}
      data-ds-block="website-builder.buttons-array.default"
      data-ds-layer="singlepage"
      role={ariaLabel ? "navigation" : undefined}
    >
      {title ? (
        <h3 className="mb-1 text-xs uppercase tracking-widest text-slate-400">
          {title}
        </h3>
      ) : null}
      {buttons.map((button) => {
        if (button.variant === "link") {
          return (
            <ButtonLink
              href={button.href}
              key={`${button.variant}:${button.href}:${button.label}`}
              label={button.label}
              size={button.size}
              tone={button.tone}
            />
          );
        }

        return button.variant === "secondary" ? (
          <ButtonSecondary
            href={button.href}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        ) : (
          <ButtonPrimary
            href={button.href}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        );
      })}
    </div>
  );
}
