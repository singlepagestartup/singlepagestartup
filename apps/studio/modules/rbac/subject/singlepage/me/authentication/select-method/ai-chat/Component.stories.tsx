import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../index";
import type { ISelectMethodAiChatProps } from "./interface";
function Component(props: ISelectMethodAiChatProps) {
  return (
    <Subject {...props} variant="me-authentication-select-method-ai-chat" />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-authentication-select-method-ai-chat",
  title: "Modules/RBAC/Subject/Singlepage/authentication/select-method/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
