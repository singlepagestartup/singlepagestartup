import type { Meta, StoryObj } from "@storybook/react";

import { ProfileAuthor, defaultProfileAuthorProps } from "./Component";

const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/author",
  component: ProfileAuthor,
  parameters: { layout: "fullscreen" },
  args: defaultProfileAuthorProps,
} satisfies Meta<typeof ProfileAuthor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
