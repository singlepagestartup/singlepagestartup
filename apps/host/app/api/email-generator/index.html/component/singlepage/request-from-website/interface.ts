export const variant = "reset-password" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    [key: string]: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
