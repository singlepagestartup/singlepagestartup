import type { Meta, StoryObj } from "@storybook/react";
import { Component as Profile } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-social-models-profile-singlepage-author-card-default",
  title: "Modules/Social/Profile/Singlepage/author-card-default",
  component: Profile,
  args: { variant: "author-card-default" },
} satisfies Meta<
  Extract<ComponentProps<typeof Profile>, { variant: "author-card-default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
