import { Component as Request } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCrmRequestDefaultProps } from "./Component";

const meta = {
  id: "modules-crm-models-request-singlepage-default",
  title: "Modules/CRM/Request/Singlepage/default",
  component: Request,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultCrmRequestDefaultProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Request>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
