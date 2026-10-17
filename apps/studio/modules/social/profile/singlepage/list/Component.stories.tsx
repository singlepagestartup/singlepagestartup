import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Profile } from "../../index";
const meta = {
  id: "modules-social-models-profile-singlepage-list",
  title: "Modules/Social/Profile/Singlepage/list",
  component: Profile,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
