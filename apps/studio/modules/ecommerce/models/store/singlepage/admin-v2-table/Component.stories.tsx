import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleStore } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Store/Singlepage/admin-v2-table",
  component: EcommerceModuleStore,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof EcommerceModuleStore>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
