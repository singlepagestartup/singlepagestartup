import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleRequest } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Request/Singlepage/admin-v2-table",
  component: CrmModuleRequest,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CrmModuleRequest>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
