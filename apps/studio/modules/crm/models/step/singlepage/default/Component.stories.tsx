import type { Meta, StoryObj } from "@storybook/react";

import { CrmStepDefault, defaultCrmStepDefaultProps } from "./Component";

const meta = {
  title: "Modules/CRM/Models/Step/Singlepage/default",
  component: CrmStepDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmStepDefaultProps,
} satisfies Meta<typeof CrmStepDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
