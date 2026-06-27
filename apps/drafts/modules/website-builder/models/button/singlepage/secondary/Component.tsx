import { Play, type LucideIcon } from "lucide-react";

export interface ButtonSecondaryProps {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const defaultButtonSecondaryProps: ButtonSecondaryProps = {
  label: "Learn More",
  href: "#features",
  icon: Play,
};

export function ButtonSecondary(props?: Partial<ButtonSecondaryProps>) {
  const label = props?.label ?? defaultButtonSecondaryProps.label;
  const href = props?.href ?? defaultButtonSecondaryProps.href;
  const Icon = props?.icon ?? Play;

  return (
    <a
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm text-slate-700 no-underline shadow-sm transition hover:bg-slate-50"
      data-ds-block="website-builder.button.secondary"
      data-ds-layer="singlepage"
      href={href}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}
