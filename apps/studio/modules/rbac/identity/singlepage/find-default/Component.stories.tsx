import { Component as Identity } from "../..";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultIdentityFindDefaultProps } from "./Component";

const meta: Meta<
  Extract<React.ComponentProps<typeof Identity>, { variant: "find-default" }>
> = {
  id: "modules-rbac-models-identity-singlepage-identity-find-default",
  title: "Modules/RBAC/Identity/Singlepage/identity-find-default",
  component: Identity,
  args: { ...defaultIdentityFindDefaultProps, variant: "find-default" },
};

export default meta;

type Story = StoryObj<typeof Identity>;

export const Default: Story = {
  name: "default",
};

export const Empty: Story = {
  name: "empty",
  args: {
    identities: [],
  },
};
