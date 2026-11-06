import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Order } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-admin-v2-card",
  title: "Modules/Ecommerce/Order/Singlepage/admin-v2-card",
  component: Order,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Order>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
