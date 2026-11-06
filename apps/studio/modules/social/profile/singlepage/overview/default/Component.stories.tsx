import type { Meta, StoryObj } from "@storybook/react";
import { Component as Profile } from "../../../index";
import { defaultProfileOverviewProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-overview-default",
  title: "Modules/Social/Profile/Singlepage/overview/default",
  component: Profile,
  render: (args) => <Profile {...args} variant="overview-default" />,
  parameters: { layout: "padded" },
  args: { ...defaultProfileOverviewProps, variant: "overview-default" },
  argTypes: {
    name: { control: "text" },
    role: { control: "text" },
    avatar: { control: "text" },
    location: { control: "text" },
    joinedYear: { control: "number" },
    website: { control: "text" },
    socials: { control: "object" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "overview-default" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
