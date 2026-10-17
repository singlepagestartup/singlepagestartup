import { Component as Step } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmStepDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-step-singlepage-default",
  title: "Modules/CRM/Step/Singlepage/default",
  component: Step,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmStepDefaultProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Step>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
