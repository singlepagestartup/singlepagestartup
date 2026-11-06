import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Currency } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-billing-models-currency-singlepage-admin-v2-card",
  title: "Modules/Billing/Currency/Singlepage/admin-v2-card",
  component: Currency,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Currency>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
