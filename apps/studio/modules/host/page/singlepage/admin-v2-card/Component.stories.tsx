import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as HostModulePage } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Host/Models/Page/Singlepage/admin-v2-card",
  component: HostModulePage,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof HostModulePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
