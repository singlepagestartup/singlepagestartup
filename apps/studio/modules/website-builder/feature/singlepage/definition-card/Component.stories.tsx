import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-definition-card",
  title: "Modules/Website-Builder/Feature/Singlepage/definition-card",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "definition-card",
    title: "RBAC",
    subtitle: "Business",
    description:
      "Accounts, authentication, roles and current-user operations with access scope.",
    appearance: "cards",
    href: "/framework/modules/rbac",
    linkLabel: "Explore module",
    sourceHref:
      "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/rbac/README.md",
    sourceLabel: "RBAC source guide",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "definition-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Ruled: Story = {
  args: { appearance: "ruled", href: undefined, sourceHref: undefined },
};
export const Checklist: Story = {
  args: {
    appearance: "checklist",
    subtitle: undefined,
    href: undefined,
    sourceHref: undefined,
  },
};
