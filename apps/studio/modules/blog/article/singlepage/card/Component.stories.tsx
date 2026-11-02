import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultArticleCardProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-card",
  title: "Modules/Blog/Article/Singlepage/card",
  component: Article,
  parameters: { layout: "padded" },
  args: { ...defaultArticleCardProps, variant: "card" },
  argTypes: {
    layout: {
      control: "select",
      options: ["balanced", "editorial", "compact"],
    },
  },
  render: (args) => (
    <div className="max-w-sm">
      <Article {...args} variant="card" />
    </div>
  ),
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "card" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default", args: { layout: "balanced" } };
export const Editorial: Story = {
  name: "editorial",
  args: { layout: "editorial" },
};
export const Compact: Story = { name: "compact", args: { layout: "compact" } };
export const Comparison: Story = {
  name: "comparison",
  render: (args) => (
    <div className="mx-auto grid max-w-7xl items-start gap-6 lg:grid-cols-3">
      {(["balanced", "editorial", "compact"] as const).map((layout) => (
        <section className="min-w-0" key={layout}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {layout === "balanced"
              ? "Balanced · default"
              : layout === "editorial"
                ? "Editorial"
                : "Compact"}
          </h2>
          <Article {...args} layout={layout} variant="card" />
        </section>
      ))}
    </div>
  ),
};

import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
export const Framework: Story = {
  args: {
    excerptContent: (
      <WebsiteBuilderModuleWidget
        variant="content-rich"
        content="<p>A formatted <strong>article introduction</strong> with its original content.</p>"
      />
    ),
    media: [
      {
        id: "cover",
        src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
        alt: "A project discussion",
      },
      {
        id: "detail",
        src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
        alt: "Work in progress",
      },
    ],
  },
};

export const Module: Story = {
  args: {
    layout: "module",
    title: "Аккаунты и доступ",
    excerpt: "Вход в аккаунт и доступ к личным данным.",
    coverImage:
      "/module-assets/images/singlepage/generated/framework-acquisition-v2/accounts.png",
  },
};
export const Guide: Story = {
  args: {
    layout: "guide",
    title: "Профили и общение",
    excerpt: "",
    category: "01 / Social",
    actionLabel: "Как работает модуль",
    coverImage:
      "/module-assets/images/singlepage/generated/framework-article-covers-dark-v1/social.png",
  },
};
