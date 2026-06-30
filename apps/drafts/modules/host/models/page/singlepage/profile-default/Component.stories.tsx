import type { Meta, StoryObj } from "@storybook/react";

import { ProfileDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-profile-default",
  title: "Modules/Host/Models/Page/Singlepage",
  component: ProfileDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfileDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/profile",
};
