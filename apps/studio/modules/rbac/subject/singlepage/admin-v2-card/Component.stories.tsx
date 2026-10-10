import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleSubject } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/admin-v2-card",
  component: RbacModuleSubject,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof RbacModuleSubject>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
