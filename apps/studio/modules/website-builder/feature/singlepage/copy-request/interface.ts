export const variant = "copy-request" as const;

export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  description: string;
  copyLabel?: string;
  pendingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  idleLabel?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
