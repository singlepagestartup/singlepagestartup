import type { Meta, StoryObj } from "@storybook/react";

import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";
import {
  ContentFeatureFindRow,
  defaultContentFeatureFindRowProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-feature-find-row",
  component: ContentFeatureFindRow,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFeatureFindRowProps,
    contactForm: <RbacModuleSubject variant="me-crm-form-deafult" embedded />,
  },
} satisfies Meta<typeof ContentFeatureFindRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
