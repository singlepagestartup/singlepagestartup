import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Attribute } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-social-models-attribute-singlepage-admin-v2-card",
  title: "Modules/Social/Attribute/Singlepage/admin-v2-card",
  component: Attribute,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Attribute>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
