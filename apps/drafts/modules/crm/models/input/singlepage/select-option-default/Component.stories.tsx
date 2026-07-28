import type { Meta, StoryObj } from "@storybook/react";

import {
  CrmInputSelectOptionDefault,
  defaultCrmInputSelectOptionDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/CRM/Models/Input/Singlepage/select-option-default",
  component: CrmInputSelectOptionDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmInputSelectOptionDefaultProps,
} satisfies Meta<typeof CrmInputSelectOptionDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
