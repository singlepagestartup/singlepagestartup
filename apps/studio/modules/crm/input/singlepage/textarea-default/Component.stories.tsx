import { Component as Input } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmInputTextareaDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-input-singlepage-textarea-default",
  title: "Modules/CRM/Input/Singlepage/textarea-default",
  component: Input,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmInputTextareaDefaultProps, variant: "textarea-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Input>, { variant: "textarea-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
