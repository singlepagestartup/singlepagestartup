import type { Meta, StoryObj } from "@storybook/react";

import { SocialProfileFindByIdOverviewAuthor } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-blog-authors-social-profiles-slug",
  title: "Modules/Host/Models/Page/Singlepage",
  component: SocialProfileFindByIdOverviewAuthor,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialProfileFindByIdOverviewAuthor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/blog/authors/[social.profiles.slug]",
};
