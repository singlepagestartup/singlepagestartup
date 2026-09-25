import type { Meta, StoryObj } from "@storybook/react";

import {
  CrmWidgetFormListDefault,
  defaultCrmWidgetFormListDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/CRM/Models/Widget/Singlepage/form-list-default",
  component: CrmWidgetFormListDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultCrmWidgetFormListDefaultProps,
} satisfies Meta<typeof CrmWidgetFormListDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
