import type { Meta, StoryObj } from "@storybook/react";
import { Component as SocialModuleProfile } from "../../../index";
import { Component, defaultProfileOverviewProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-overview-default",
  title: "Modules/Social/Models/Profile/Singlepage/overview/default",
  component: Component,
  render: (args) => (
    <SocialModuleProfile {...args} variant="overview-default" />
  ),
  parameters: { layout: "padded" },
  args: defaultProfileOverviewProps,
  argTypes: {
    name: { control: "text" },
    role: { control: "text" },
    avatar: { control: "text" },
    location: { control: "text" },
    joinedYear: { control: "number" },
    website: { control: "text" },
    socials: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
