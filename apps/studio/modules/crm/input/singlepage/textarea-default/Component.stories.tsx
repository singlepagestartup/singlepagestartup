import type { Meta, StoryObj } from "@storybook/react";

import {
  CrmInputTextareaDefault,
  defaultCrmInputTextareaDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/CRM/Models/Input/Singlepage/textarea-default",
  component: CrmInputTextareaDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmInputTextareaDefaultProps,
} satisfies Meta<typeof CrmInputTextareaDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
