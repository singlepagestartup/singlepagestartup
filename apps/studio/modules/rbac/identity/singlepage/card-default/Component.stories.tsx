import type { Meta, StoryObj } from "@storybook/react";

import { defaultRbacIdentities } from "../../../shared";
import { Component as Identity } from "../../index";
import type { IdentityCardDefaultProps } from "./interface";
import { Component as Subject } from "../../../subject/index";
function Component(props: Partial<IdentityCardDefaultProps>) {
  return (
    <Identity
      {...props}
      variant="card-default"
      renderFlow={({ identity, action, onClose, onUpdate }) =>
        action === "reconnect" ? (
          <Subject
            variant="me-authentication-provider-connect-default"
            provider={identity.provider}
            account={identity.account || identity.email}
            onCancel={onClose}
            onComplete={(account) => onUpdate({ ...identity, account })}
          />
        ) : (
          <Subject
            key={action}
            variant="me-authentication-email-and-password-account-change-default"
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
  id: "modules-rbac-models-identity-singlepage-card-default",
  title: "Modules/RBAC/Identity/Singlepage/card-default",
  component: Component,
  args: {
    identity: defaultRbacIdentities[0],
  },
} satisfies Meta<typeof Component>;

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
