import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as HostModulePage } from "../../index";

const meta = {
  title: "Modules/Host/Models/Page/Singlepage/admin-v2-table",
  component: HostModulePage,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof HostModulePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
