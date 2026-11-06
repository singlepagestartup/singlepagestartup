import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-social-module-profile-slug-author",
  title: "Modules/Host/Page/Singlepage/social-module-profile-slug-author",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    variant: "social-module-profile-slug-author",
    authorSlug: "sps-editorial",
  },
  argTypes: { authorSlug: { control: "text" } },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "social-module-profile-slug-author" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
export const Missing: Story = { args: { authorSlug: "not-in-the-journal" } };
