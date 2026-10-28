import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import type { ComponentProps } from "react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-collection",
  title: "Modules/Website-Builder/Widget/Singlepage/content-collection",
  component: Widget,
  args: {
    variant: "content-collection",
    title: "Community",
    description: "Stories and projects shared by the community.",
    className: "sm:grid-cols-2 lg:grid-cols-3",
    children: ["First item", "Second item", "Third item"].map((title) => (
      <article
        key={title}
        className="rounded-2xl border border-border bg-card p-6"
      >
        {title}
      </article>
    )),
    footer: (
      <nav
        aria-label="Collection pages"
        className="flex items-center justify-between gap-3"
      >
        <p className="text-sm text-muted-foreground">Page 1 of 2</p>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm"
        >
          Next
        </button>
      </nav>
    ),
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "content-collection" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Grid: Story = {};
export const Stack: Story = {
  args: {
    title: undefined,
    description: undefined,
    className: "grid-cols-1",
    footer: undefined,
    children: (
      <article className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-3xl font-semibold">Rendered model heading</h1>
        <p className="mt-3 text-muted-foreground">
          A model can own its detail heading inside an unlabelled frame.
        </p>
      </article>
    ),
  },
};
