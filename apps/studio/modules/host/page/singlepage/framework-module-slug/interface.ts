export const variant = "framework-module-slug" as const;

export interface IComponentProps {
  variant?: typeof variant;
  moduleSlug?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
