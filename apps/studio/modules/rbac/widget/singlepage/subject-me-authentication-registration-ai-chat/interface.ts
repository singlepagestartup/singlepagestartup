export const variant =
  "subject-me-authentication-registration-ai-chat" as const;
export interface IProps {}
export interface IComponentProps extends IProps {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
