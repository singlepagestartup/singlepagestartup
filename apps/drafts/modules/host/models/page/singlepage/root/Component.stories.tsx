import type { Meta, StoryObj } from "@storybook/react";

import { HomeDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-root",
  title: "Modules/Host/Models/Page/Singlepage",
  component: HomeDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/",
};
