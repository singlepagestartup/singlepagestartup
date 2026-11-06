import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Skill } from "../../index";

const meta = {
  id: "modules-social-models-skill-singlepage-admin-v2-table",
  title: "Modules/Social/Skill/Singlepage/admin-v2-table",
  component: Skill,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Skill>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
