import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleSkill } from "../../index";

const meta = {
  title: "Modules/Social/Models/Skill/Singlepage/admin-v2-table",
  component: SocialModuleSkill,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SocialModuleSkill>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
