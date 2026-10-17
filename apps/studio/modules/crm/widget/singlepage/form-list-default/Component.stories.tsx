import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmWidgetFormListDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-widget-singlepage-form-list-default",
  title: "Modules/CRM/Widget/Singlepage/form-list-default",
  component: Widget,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultCrmWidgetFormListDefaultProps,
    variant: "form-list-default",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "form-list-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
