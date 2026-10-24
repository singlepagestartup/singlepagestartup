import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-split",
  title: "Modules/Website-Builder/Widget/Singlepage/content-feature-split",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-feature-split",
    title: "Turn your business brief into a product.",
    headingLevel: "h2",
    eyebrow: "Code Framework · Free code",
    description:
      "Prepare your business decisions, then build with a coding agent and reusable modules.",
    media: {
      src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
      alt: "Two people discussing an idea at a worktable.",
      priority: true,
    },
    actions: (
      <a
        href="https://github.com/singlepagestartup/singlepagestartup"
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Get the code
      </a>
    ),
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "content-feature-split" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TextOnly: Story = {
  args: {
    headingLevel: "h2",
    eyebrow: "AI Chat → documents → development",
    title: "Prepare the business before you build the page.",
    media: undefined,
    appearance: "muted",
  },
};
export const Checklist: Story = {
  args: {
    headingLevel: "h2",
    title: "Reuse the functions your product needs.",
    mediaPosition: "left",
    items: [
      {
        id: "accounts",
        title: "Accounts and access",
        description: "Give people an account and control access to their data.",
      },
    ],
  },
};
