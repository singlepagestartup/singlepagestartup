import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleSkill } from "../../index";

const meta = {
  title: "Modules/Social/Models/Skill/Singlepage/admin-v2-table",
  component: SocialModuleSkill,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof SocialModuleSkill>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
