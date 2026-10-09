import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleLogotype } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Logotype/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleLogotype,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof WebsiteBuilderModuleLogotype>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
