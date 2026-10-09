import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleWidget } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/admin-v2-card",
  component: EcommerceModuleWidget,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof EcommerceModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
