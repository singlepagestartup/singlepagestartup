import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Chunk } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-knowledge-models-chunk-singlepage-admin-v2-card",
  title: "Modules/Knowledge/Chunk/Singlepage/admin-v2-card",
  component: Chunk,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Chunk>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
