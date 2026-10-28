export const variant = "framework-module-find" as const;

export interface IComponentProps {
  variant?: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
