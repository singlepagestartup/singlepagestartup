import type { Meta, StoryObj } from "@storybook/react";

import { CrmOptionDefault, defaultCrmOptionDefaultProps } from "./Component";

const meta = {
  title: "Modules/CRM/Models/Option/Singlepage/default",
  component: CrmOptionDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmOptionDefaultProps,
} satisfies Meta<typeof CrmOptionDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
