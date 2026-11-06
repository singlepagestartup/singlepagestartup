import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Permission } from "../../index";

const meta = {
  id: "modules-rbac-models-permission-singlepage-admin-v2-table",
  title: "Modules/RBAC/Permission/Singlepage/admin-v2-table",
  component: Permission,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Permission>,
    { variant: "admin-v2-table" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
