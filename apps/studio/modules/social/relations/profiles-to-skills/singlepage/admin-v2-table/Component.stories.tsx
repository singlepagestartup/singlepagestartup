import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToSkills } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Skills/Singlepage/admin-v2-table",
  component: ProfilesToSkills,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToSkills>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
