import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToAttributes } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Attributes/Singlepage/admin-v2-table",
  component: ProfilesToAttributes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToAttributes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
