export const variant = "reset-password" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    title: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
