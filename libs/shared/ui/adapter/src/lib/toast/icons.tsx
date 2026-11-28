import { Icon } from "../icons";
import type { IToastIconProps } from "./interface";

const icons = {
  default: {
    name: "bell",
    color:
      "text-slate-600 in-[.dark]:text-slate-300 group-data-[sonner-theme=dark]/toaster:text-slate-300",
  },
  loading: {
    name: "spinner-gap",
    color:
      "text-slate-600 in-[.dark]:text-slate-300 group-data-[sonner-theme=dark]/toaster:text-slate-300",
  },
  info: {
    name: "info",
    color:
      "text-sky-600 in-[.dark]:text-sky-300 group-data-[sonner-theme=dark]/toaster:text-sky-300",
  },
  success: {
    name: "check",
    color:
      "text-green-700 in-[.dark]:text-green-300 group-data-[sonner-theme=dark]/toaster:text-green-300",
  },
  warning: {
    name: "warning",
    color:
      "text-orange-700 in-[.dark]:text-orange-300 group-data-[sonner-theme=dark]/toaster:text-orange-300",
  },
  error: {
    name: "warning",
    color:
      "text-rose-700 in-[.dark]:text-rose-300 group-data-[sonner-theme=dark]/toaster:text-rose-300",
  },
} as const;

export function ToastIcon({ type, className = "" }: IToastIconProps) {
  if (type === "close") {
    return <Icon name="x" className={"size-[1.125rem] " + className} />;
  }

  const { name, color } = icons[type];
  return (
    <span
      aria-hidden="true"
      data-toast-icon={type}
      className={`grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-current/[0.065] ring-1 ring-inset ring-current/[0.09] sm:size-12 ${color} ${className}`}
    >
      <Icon
        name={name}
        size={24}
        className={type === "loading" ? "motion-safe:animate-spin" : undefined}
      />
    </span>
  );
}
