import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileArticleFindByIdCommentFormDefaultProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-article-find-by-id-comment-form-default",
  title:
    "Modules/Social/Profile/Singlepage/article-find-by-id-comment-form-default",
  component: Profile,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultProfileArticleFindByIdCommentFormDefaultProps,
    variant: "article-find-by-id-comment-form-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Profile>,
    { variant: "article-find-by-id-comment-form-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
