import { Component as Option } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmOptionDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-option-singlepage-default",
  title: "Modules/CRM/Option/Singlepage/default",
  component: Option,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmOptionDefaultProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Option>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
