import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";

const meta = {
  id: "modules-ecommerce-models-widget-singlepage-token-find",
  title: "Modules/Ecommerce/Widget/Singlepage/token-find",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "token-find",
    registrationHref:
      "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-registration-ai-chat--default",
    chatHref:
      "/?path=/story/modules-host-models-page-singlepage-ai-chat--default",
    frameworkHref:
      "/?path=/story/modules-host-models-page-singlepage-framework--default",
    linkTarget: "_top",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "token-find" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
