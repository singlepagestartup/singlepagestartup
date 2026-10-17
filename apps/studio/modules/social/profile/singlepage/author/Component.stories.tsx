import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileAuthorProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-author",
  title: "Modules/Social/Profile/Singlepage/author",
  component: Profile,
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultProfileAuthorProps,
    variant: "author",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "author" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
