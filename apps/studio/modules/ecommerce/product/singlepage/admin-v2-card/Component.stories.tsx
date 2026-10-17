import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Product } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-card",
  title: "Modules/Ecommerce/Product/Singlepage/admin-v2-card",
  component: Product,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
