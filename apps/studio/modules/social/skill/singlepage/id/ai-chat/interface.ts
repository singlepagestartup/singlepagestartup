export const variant = "id-ai-chat";

export interface IAIChatSkill {
  id: string;
  slug: string;
  title: string;
  adminTitle: string;
  description: string;
  variant?: "id-ai-chat";
}

export interface IComponentVariantProps {
  variant?: "id-ai-chat";
  data?: IAIChatSkill;
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
