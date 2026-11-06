import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../..";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-ecommerce-module-product-list-default",
  title:
    "Modules/RBAC/Widget/Singlepage/subject-me-ecommerce-module-product-list-default",
  component: Widget,
  args: {
    variant: "subject-me-ecommerce-module-product-list-default",
    state: "configured",
    language: "en",
  },
  parameters: { layout: "padded" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-ecommerce-module-product-list-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { state: "empty" } };
export const Unavailable: Story = { args: { state: "unavailable" } };
