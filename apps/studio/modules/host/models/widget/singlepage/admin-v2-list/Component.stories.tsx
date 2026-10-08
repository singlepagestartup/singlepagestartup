import type { Meta, StoryObj } from "@storybook/react";
import { HostWidgetAdminV2List } from "./Component";
const meta = {
  title: "Modules/Host/Models/Widget/Singlepage/admin-v2-list",
  component: HostWidgetAdminV2List,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostWidgetAdminV2List>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
