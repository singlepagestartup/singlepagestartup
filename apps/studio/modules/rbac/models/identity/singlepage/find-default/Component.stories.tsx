import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  IdentityFindDefault,
  defaultIdentityFindDefaultProps,
} from "./Component";

const meta: Meta<typeof IdentityFindDefault> = {
  title: "Modules/RBAC/Models/Identity/Singlepage/identity-find-default",
  component: IdentityFindDefault,
  args: defaultIdentityFindDefaultProps,
};

export default meta;

type Story = StoryObj<typeof IdentityFindDefault>;

export const Default: Story = {
  name: "default",
};

export const Empty: Story = {
  name: "empty",
  args: {
    identities: [],
    relations: [],
  },
};
