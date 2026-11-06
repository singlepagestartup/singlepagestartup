export const variant = "subject-me-crm-module-form-support-ai-chat" as const;
export interface IProps {
  projectHref?: string;
}
export interface IComponentProps extends IProps {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
