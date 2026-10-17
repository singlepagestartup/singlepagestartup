import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Role } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-rbac-models-role-singlepage-admin-v2-card",
  title: "Modules/RBAC/Role/Singlepage/admin-v2-card",
  component: Role,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Role>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
