import type { Meta, StoryObj } from "@storybook/react";
import { Component as Profile } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-social-models-profile-singlepage-author-overview-default",
  title: "Modules/Social/Profile/Singlepage/author-overview-default",
  component: Profile,
  args: { variant: "author-overview-default" },
} satisfies Meta<
  Extract<
    ComponentProps<typeof Profile>,
    { variant: "author-overview-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
