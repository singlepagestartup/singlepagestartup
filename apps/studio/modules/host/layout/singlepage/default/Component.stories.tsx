import type { Meta, StoryObj } from "@storybook/react";
import { HostLayoutDefault } from "./Component";
const meta = {
  title: "Modules/Host/Models/Layout/Singlepage/default",
  component: HostLayoutDefault,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostLayoutDefault>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
