import type { Meta, StoryObj } from "@storybook/react";

import {
  ProfileAuthorFindByIdOverviewDefault,
  defaultProfileAuthorFindByIdOverviewDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Social/Models/Profile/Singlepage/author-find-by-id-overview-default",
  component: ProfileAuthorFindByIdOverviewDefault,
  parameters: { layout: "fullscreen" },
  args: defaultProfileAuthorFindByIdOverviewDefaultProps,
} satisfies Meta<typeof ProfileAuthorFindByIdOverviewDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
