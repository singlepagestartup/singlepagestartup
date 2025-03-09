export const variant = "generate-template-opengraph-image-default" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    title?: string;
    subtitle?: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
