import { Component as Subject } from "../../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "storybook/test";

import { defaultSubjectMeProfileInformationProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-social-module-profile-id-settings-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/me/social-module/profile/id/settings/ai-chat",
  component: Subject,
  args: {
    ...defaultSubjectMeProfileInformationProps,
    variant: "me-social-module-profile-id-settings-ai-chat",
  },
  argTypes: { saveError: { control: "text" } },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "me-social-module-profile-id-settings-ai-chat" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const SaveError: Story = {
  args: { saveError: "Conflict error. Entity already exists" },
};

export const Saved: Story = {
  parameters: { toastDuration: Infinity },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /save/i }));
    await expect(
      within(canvasElement.ownerDocument.body).findByText("Profile saved"),
    ).resolves.toBeVisible();
  },
};
