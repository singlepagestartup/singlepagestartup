import type { Meta, StoryObj } from "@storybook/react";

import {
  ProfileArticleFindByIdCommentFormDefault,
  defaultProfileArticleFindByIdCommentFormDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Social/Models/Profile/Singlepage/article-find-by-id-comment-form-default",
  component: ProfileArticleFindByIdCommentFormDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultProfileArticleFindByIdCommentFormDefaultProps,
} satisfies Meta<typeof ProfileArticleFindByIdCommentFormDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
