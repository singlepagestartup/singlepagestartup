import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Category } from "../../index";

const meta = {
  id: "modules-blog-models-category-singlepage-admin-v2-table",
  title: "Modules/Blog/Category/Singlepage/admin-v2-table",
  component: Category,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Category>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
