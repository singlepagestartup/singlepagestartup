import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToActions } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Actions/Singlepage/admin-v2-table",
  component: ProfilesToActions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
