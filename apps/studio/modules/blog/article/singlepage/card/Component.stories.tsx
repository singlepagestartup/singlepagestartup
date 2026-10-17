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
