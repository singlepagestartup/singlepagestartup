import type { Meta, StoryObj } from "@storybook/react";

import { defaultRbacIdentities } from "../../../shared";
import { Component as RbacModuleIdentity } from "../../index";
import type { IdentityCardDefaultProps } from "./Component";
function Example(props: Partial<IdentityCardDefaultProps>) {
  return (
    <RbacModuleIdentity
      {...props}
      variant="card-default"
      renderFlow={({ identity, action, onClose, onUpdate }) =>
        action === "reconnect" ? (
          <RbacModuleIdentity
            variant="provider-connect"
            provider={identity.provider}
            account={identity.account || identity.email}
            onCancel={onClose}
            onComplete={(account) => onUpdate({ ...identity, account })}
          />
        ) : (
          <RbacModuleIdentity
            key={action}
            variant="account-change"
            kind={action === "change-email" ? "email" : "password"}
            email={identity.email}
            onCancel={onClose}
            onComplete={(email) => {
              if (email) onUpdate({ ...identity, email });
            }}
          />
        )
      }
    />
  );
}

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/card-default",
  component: Example,
  args: {
    identity: defaultRbacIdentities[0],
  },
} satisfies Meta<typeof Example>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const External: Story = {
  args: {
    identity: defaultRbacIdentities[1],
  },
  name: "external",
};
