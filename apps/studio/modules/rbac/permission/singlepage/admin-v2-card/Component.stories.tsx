import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Permission } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-rbac-models-permission-singlepage-admin-v2-card",
  title: "Modules/RBAC/Permission/Singlepage/admin-v2-card",
  component: Permission,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Permission>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
