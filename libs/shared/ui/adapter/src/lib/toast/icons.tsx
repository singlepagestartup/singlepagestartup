import { Icon } from "../icons";
import type { IToastIconProps } from "./interface";

/** Phosphor Regular status glyphs; loading respects reduced-motion settings. */
export function ToastIcon({ type, className = "" }: IToastIconProps) {
  if (type === "close")
    return <Icon name="x" className={"size-4 " + className} />;
  const name =
    type === "success"
      ? "check-circle"
      : type === "error"
        ? "x-circle"
        : type === "warning"
          ? "warning"
          : type === "loading"
            ? "spinner-gap"
            : type === "default"
              ? "bell"
              : "info";
  const tone =
    type === "success"
      ? "bg-primary text-primary-foreground"
      : type === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-foreground";
  return (
    <span
      aria-hidden="true"
      data-toast-icon={type}
      className={
        "flex size-9 shrink-0 items-center justify-center rounded-lg " +
        tone +
        " " +
        className
      }
    >
      <Icon
        name={name}
        className={type === "loading" ? "motion-safe:animate-spin" : undefined}
      />
    </span>
  );
}
