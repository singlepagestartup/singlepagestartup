import type { Meta, StoryObj } from "@storybook/react";
import { ArticleCard, defaultArticleCardProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/card",
  component: ArticleCard,
  parameters: { layout: "padded" },
  args: defaultArticleCardProps,
  argTypes: {
    layout: {
      control: "select",
      options: ["balanced", "editorial", "compact"],
    },
  },
  render: (args) => (
    <div className="max-w-sm">
      <ArticleCard {...args} />
    </div>
  ),
} satisfies Meta<typeof ArticleCard>;

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
          <h2 className="mb-3 text-sm font-semibold text-[var(--workspace-brand-foreground)]">
            {layout === "balanced"
              ? "Balanced · default"
              : layout === "editorial"
                ? "Editorial"
                : "Compact"}
          </h2>
          <ArticleCard {...args} layout={layout} />
        </section>
      ))}
    </div>
  ),
};
