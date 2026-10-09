import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToMessages } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Messages/Singlepage/admin-v2-table",
  component: ProfilesToMessages,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToMessages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
