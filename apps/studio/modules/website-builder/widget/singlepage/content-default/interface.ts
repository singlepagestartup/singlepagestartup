export const variant = "content-default";

export interface ContentDefaultProps {
  variant?: "content-default";
  counterLabel?: string;
  counterValue?: string | number;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  mediaLabel?: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

type IVariantInputs = NonNullable<ContentDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
