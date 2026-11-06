import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-authentication-registration-ai-chat",
  title:
    "Modules/RBAC/Widget/Singlepage/subject-me-authentication-registration-ai-chat",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "subject-me-authentication-registration-ai-chat" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-authentication-registration-ai-chat" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
