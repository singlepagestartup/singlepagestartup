import type { Meta, StoryObj } from "@storybook/react";

import { RbacSubjectAuthenticationSelectMethod } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-subject-authentication-select-method",
  title: "Modules/Host/Models/Page/Singlepage",
  component: RbacSubjectAuthenticationSelectMethod,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacSubjectAuthenticationSelectMethod>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/rbac/subject/authentication/select-method",
};
