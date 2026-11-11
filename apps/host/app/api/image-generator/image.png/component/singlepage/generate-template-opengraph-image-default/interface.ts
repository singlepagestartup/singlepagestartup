export const variant = "generate-template-opengraph-image-default" as const;

export interface IComponentProps {
  variant: typeof variant;
  backgroundImage?: string;
  data: {
    title?: string;
    subtitle?: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
