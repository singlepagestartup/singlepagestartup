import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Thread } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-social-models-thread-singlepage-admin-v2-card",
  title: "Modules/Social/Thread/Singlepage/admin-v2-card",
  component: Thread,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Thread>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
