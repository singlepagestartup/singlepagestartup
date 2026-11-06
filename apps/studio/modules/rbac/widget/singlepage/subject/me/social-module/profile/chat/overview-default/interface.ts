import type { ReactNode } from "react";
export const variant =
  "subject-me-social-module-profile-chat-overview-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  state?:
    | "ready"
    | "loading"
    | "empty"
    | "access-denied"
    | "error"
    | "sign-in-required";
  children?: ReactNode;
  onRetry?: () => void;
}
export interface IComponentPropsExtended extends IComponentProps {}
