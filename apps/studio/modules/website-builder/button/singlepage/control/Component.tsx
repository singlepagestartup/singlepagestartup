import type { IComponentProps, IControlProps } from "./interface";
export type { IControlProps } from "./interface";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
export const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  danger: `${buttonBase} border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95 ${focus}`,
};
export const Component = forwardRef<HTMLButtonElement, IControlProps>(
  function Button(
    {
      variant = "control",
      appearance = "primary",
      type = "button",
      className,
      ...props
    },
    ref,
  ) {
    const appearances = {
      primary: kit.button,
      secondary: kit.secondary,
      plain: kit.plain,
      danger: kit.danger,
    };
    return (
      <button
        ref={ref}
        type={type}
        className={twMerge(appearances[appearance], className)}
        {...props}
        data-module="website-builder"
        data-model="button"
        data-variant={variant}
      />
    );
  },
);
