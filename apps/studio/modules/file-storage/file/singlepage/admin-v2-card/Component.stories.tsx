import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as File } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-file-storage-models-file-singlepage-admin-v2-card",
  title: "Modules/File-Storage/File/Singlepage/admin-v2-card",
  component: File,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof File>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
