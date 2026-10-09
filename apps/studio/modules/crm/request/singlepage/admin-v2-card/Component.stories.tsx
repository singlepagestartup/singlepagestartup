import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleRequest } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/CRM/Models/Request/Singlepage/admin-v2-card",
  component: CrmModuleRequest,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof CrmModuleRequest>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
