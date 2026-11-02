import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "me-navigation-controls-ai-chat" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  socialModuleProfileId?: string;
  socialModuleChatId?: string;
  settingsSelected?: boolean;
}
