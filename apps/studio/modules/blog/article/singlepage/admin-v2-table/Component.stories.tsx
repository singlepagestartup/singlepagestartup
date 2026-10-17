import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Article } from "../../index";

const meta = {
  id: "modules-blog-models-article-singlepage-admin-v2-table",
  title: "Modules/Blog/Article/Singlepage/admin-v2-table",
  component: Article,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
