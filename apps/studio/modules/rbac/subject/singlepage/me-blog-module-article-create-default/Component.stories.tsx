import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-blog-module-article-create-default",
  title:
    "Modules/Rbac/Subject/Singlepage/me-blog-module-article-create-default",
  component: Subject,
  args: { variant: "me-blog-module-article-create-default" },
} satisfies Meta<
  Extract<
    ComponentProps<typeof Subject>,
    { variant: "me-blog-module-article-create-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Guest: Story = { args: { signedIn: false } };
export const Pending: Story = { args: { pending: true } };
export const Error: Story = {
  args: {
    error:
      "Publishing failed. Your draft is preserved; retry the same request.",
  },
};
export const Rejected: Story = {
  args: {
    error:
      "The selected category is unavailable. Edit your draft and submit it again.",
    rejected: true,
  },
};
