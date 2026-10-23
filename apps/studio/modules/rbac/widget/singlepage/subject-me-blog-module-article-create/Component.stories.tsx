import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-blog-module-article-create",
  title: "Modules/Rbac/Widget/Singlepage/subject-me-blog-module-article-create",
  component: Widget,
  args: { variant: "subject-me-blog-module-article-create" },
} satisfies Meta<
  Extract<
    ComponentProps<typeof Widget>,
    { variant: "subject-me-blog-module-article-create" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Guest: StoryObj<typeof meta> = { args: { signedIn: false } };
export const Pending: StoryObj<typeof meta> = { args: { pending: true } };
export const Error: StoryObj<typeof meta> = {
  args: {
    error:
      "Publication could not be confirmed. Your draft is preserved; retry the same request.",
  },
};
