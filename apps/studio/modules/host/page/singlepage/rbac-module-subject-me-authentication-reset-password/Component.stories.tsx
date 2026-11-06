import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-authentication-reset-password",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-authentication-reset-password",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "rbac-module-subject-me-authentication-reset-password" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "rbac-module-subject-me-authentication-reset-password" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
