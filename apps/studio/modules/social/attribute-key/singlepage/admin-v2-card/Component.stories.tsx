import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributeKey } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-social-models-attribute-key-singlepage-admin-v2-card",
  title: "Modules/Social/Attribute-Key/Singlepage/admin-v2-card",
  component: AttributeKey,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof AttributeKey>,
    { variant: "admin-v2-card" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
