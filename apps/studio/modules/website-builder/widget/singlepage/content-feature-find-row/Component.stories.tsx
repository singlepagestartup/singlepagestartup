import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { defaultContentFeatureFindRowProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-find-row",
  title: "Modules/Website-Builder/Widget/Singlepage/content-feature-find-row",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFeatureFindRowProps,
    contactForm: (
      <RbacModuleSubject variant="me-crm-module-form-default" embedded />
    ),
    variant: "content-feature-find-row",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-feature-find-row" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
