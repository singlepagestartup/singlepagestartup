export const variant = "generate-email-agent-result-admin" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    title: string;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
