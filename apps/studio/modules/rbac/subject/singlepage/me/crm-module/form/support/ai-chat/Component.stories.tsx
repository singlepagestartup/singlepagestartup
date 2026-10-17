import { Component as Subject } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return <Subject variant="me-crm-module-form-support-ai-chat" />;
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-crm-module-form-support-ai-chat",
  title: "Modules/RBAC/Subject/Singlepage/me/crm-module/form/support/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
