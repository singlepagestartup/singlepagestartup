import type { Meta, StoryObj } from "@storybook/react";
import { HostPageAdminV2List } from "./Component";
const meta = {
  title: "Modules/Host/Models/Page/Singlepage/admin-v2-list",
  component: HostPageAdminV2List,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPageAdminV2List>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
