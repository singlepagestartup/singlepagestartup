import { Component as Form } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmFormDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-form-singlepage-default",
  title: "Modules/CRM/Form/Singlepage/default",
  component: Form,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmFormDefaultProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Form>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
