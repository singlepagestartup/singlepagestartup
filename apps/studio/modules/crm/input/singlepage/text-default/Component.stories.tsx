import { Component as Input } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmInputTextDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-input-singlepage-text-default",
  title: "Modules/CRM/Input/Singlepage/text-default",
  component: Input,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmInputTextDefaultProps, variant: "text-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Input>, { variant: "text-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
