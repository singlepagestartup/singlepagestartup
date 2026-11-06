import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-form",
  title: "Modules/Website-Builder/Widget/Singlepage/content-form",
  component: Widget,
  args: {
    variant: "content-form",
    title: "Create article",
    description:
      "Share implementation notes and projects with the SPS community.",
    children: (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Rendered domain form slot
      </div>
    ),
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "content-form" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
