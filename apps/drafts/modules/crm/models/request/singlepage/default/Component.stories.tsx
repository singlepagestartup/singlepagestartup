import type { Meta, StoryObj } from "@storybook/react";

import { CrmRequestDefault, defaultCrmRequestDefaultProps } from "./Component";

const meta = {
  title: "Modules/CRM/Models/Request/Singlepage/default",
  component: CrmRequestDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmRequestDefaultProps,
} satisfies Meta<typeof CrmRequestDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
