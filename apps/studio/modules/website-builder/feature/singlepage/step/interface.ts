export const variant = "step" as const;

export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  subtitle: string;
  description: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
