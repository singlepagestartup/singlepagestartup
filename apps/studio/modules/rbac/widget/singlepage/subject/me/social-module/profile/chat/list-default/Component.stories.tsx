import { Component as Widget } from "../../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-social-module-profile-chat-list-default",
  title:
    "Modules/RBAC/Widget/Singlepage/subject/me/social-module/profile/chat/list-default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "subject-me-social-module-profile-chat-list-default",
    state: "ready",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-social-module-profile-chat-list-default" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Loading: StoryObj<typeof meta> = { args: { state: "loading" } };
export const Empty: StoryObj<typeof meta> = { args: { state: "empty" } };
export const AccessDenied: StoryObj<typeof meta> = {
  args: { state: "access-denied" },
};
export const Error: StoryObj<typeof meta> = { args: { state: "error" } };
export const SignInRequired: StoryObj<typeof meta> = {
  args: { state: "sign-in-required" },
};
