import type { Meta, StoryObj } from "@storybook/react";

import { CrmFormDefault, defaultCrmFormDefaultProps } from "./Component";

const meta = {
  title: "Modules/CRM/Models/Form/Singlepage/default",
  component: CrmFormDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmFormDefaultProps,
} satisfies Meta<typeof CrmFormDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
