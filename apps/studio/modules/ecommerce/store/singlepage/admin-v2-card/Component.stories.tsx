import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Store } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-ecommerce-models-store-singlepage-admin-v2-card",
  title: "Modules/Ecommerce/Store/Singlepage/admin-v2-card",
  component: Store,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Store>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
