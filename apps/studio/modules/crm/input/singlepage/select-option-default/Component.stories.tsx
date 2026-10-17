import { Component as Input } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmInputSelectOptionDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-input-singlepage-select-option-default",
  title: "Modules/CRM/Input/Singlepage/select-option-default",
  component: Input,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultCrmInputSelectOptionDefaultProps,
    variant: "select-option-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Input>,
    { variant: "select-option-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
