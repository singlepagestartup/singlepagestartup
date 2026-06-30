import type { Meta, StoryObj } from "@storybook/react";

import { SocialProfileFindByIdOverviewAuthor } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-social-profile-find-by-id-overview-author",
  title: "Modules/Host/Models/Page/Singlepage",
  component: SocialProfileFindByIdOverviewAuthor,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialProfileFindByIdOverviewAuthor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/social/profiles/[social.profiles.id]",
};

export const RunnableAuthorRoute: Story = {
  name: "/blog/author/:authorSlug",
};
