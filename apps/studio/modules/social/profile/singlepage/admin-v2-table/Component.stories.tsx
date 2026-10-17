import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Profile } from "../../index";

const meta = {
  id: "modules-social-models-profile-singlepage-admin-v2-table",
  title: "Modules/Social/Profile/Singlepage/admin-v2-table",
  component: Profile,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
