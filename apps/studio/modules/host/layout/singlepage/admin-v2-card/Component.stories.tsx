import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Layout } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-host-models-layout-singlepage-admin-v2-card",
  title: "Modules/Host/Layout/Singlepage/admin-v2-card",
  component: Layout,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
