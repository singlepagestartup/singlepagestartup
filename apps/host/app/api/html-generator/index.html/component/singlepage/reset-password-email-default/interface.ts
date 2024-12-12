export const variant = "reset-password-email-default" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    code: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
