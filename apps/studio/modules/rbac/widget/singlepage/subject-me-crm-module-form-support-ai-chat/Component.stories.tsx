import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-crm-module-form-support-ai-chat",
  title:
    "Modules/RBAC/Widget/Singlepage/subject-me-crm-module-form-support-ai-chat",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "subject-me-crm-module-form-support-ai-chat" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-crm-module-form-support-ai-chat" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
