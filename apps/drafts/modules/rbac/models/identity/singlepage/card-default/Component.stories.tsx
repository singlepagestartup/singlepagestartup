import type { Meta, StoryObj } from "@storybook/react";

import {
  defaultRbacIdentities,
  defaultRbacSubjectToIdentities,
} from "../../../../shared";
import { IdentityCardDefault } from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/card-default",
  component: IdentityCardDefault,
  args: {
    identity: defaultRbacIdentities[0],
    relation: defaultRbacSubjectToIdentities[0],
  },
} satisfies Meta<typeof IdentityCardDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const External: Story = {
  args: {
    identity: defaultRbacIdentities[1],
    relation: defaultRbacSubjectToIdentities[1],
  },
  name: "external",
};
