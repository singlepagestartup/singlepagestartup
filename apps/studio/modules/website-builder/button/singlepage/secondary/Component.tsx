import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Play,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface ButtonSecondaryProps {
  label: string;
  href: string;
  icon?: ModuleIcon;
}

export const defaultButtonSecondaryProps: ButtonSecondaryProps = {
  label: "Learn more",
  href: "#features",
  icon: Play,
};

export function ButtonSecondary(props?: Partial<ButtonSecondaryProps>) {
  const label = props?.label ?? defaultButtonSecondaryProps.label;
  const href = props?.href ?? defaultButtonSecondaryProps.href;
  const Icon = props?.icon ?? Play;

  return (
    <a
      className={`${kit.secondary} no-underline hover:bg-[var(--workspace-brand-background)]`}
      data-ds-block="website-builder.button.secondary"
      data-ds-layer="singlepage"
      href={href}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
