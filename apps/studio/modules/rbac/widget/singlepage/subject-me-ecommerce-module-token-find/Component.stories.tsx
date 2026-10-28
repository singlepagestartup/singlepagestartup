import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../..";

const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-ecommerce-module-token-find",
  title:
    "Modules/RBAC/Widget/Singlepage/subject-me-ecommerce-module-token-find",
  component: Widget,
  args: { variant: "subject-me-ecommerce-module-token-find" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-ecommerce-module-token-find" }
  >
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
