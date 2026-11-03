import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileArticleFindByIdCommentFindDefaultProps } from "./Component";

const meta = {
  id: "modules-social-models-widget-singlepage-profile-article-find-by-id-comment-find-default",
  title:
    "Modules/Social/Widget/Singlepage/profile-article-find-by-id-comment-find-default",
  component: Widget,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultProfileArticleFindByIdCommentFindDefaultProps,
    variant: "profile-article-find-by-id-comment-find-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "profile-article-find-by-id-comment-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
