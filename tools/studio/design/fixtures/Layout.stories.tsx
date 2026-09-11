import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { DesignRenderer } from "../../../../apps/studio/workspace/utils/components/DesignRenderer";
import {
  designWorkspaces,
  designLayouts,
} from "../../../../apps/studio/workspace/utils/design/source";
import { resolvedProjectDesignData } from "../../../../apps/studio/workspace/utils/design/data";
import {
  parseDesignLayout,
  resolveDesignLayoutView,
  type IDesignTemplateProps,
} from "../../../../apps/studio/workspace/utils/design/layout";
import { documentConfirmation } from "../../../../tools/studio/workspace/document";
import layoutSource from "./startup/layout.yaml?raw";

const components = import.meta.glob<{ default?: ComponentType }>(
  "./startup/**/*.{tsx,jsx}",
  { eager: true },
);
const markdown = import.meta.glob<string>("./startup/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});
const files = import.meta.glob("./startup/**/*", {
  import: "default",
  query: "?url",
});
const keys = <T,>(entries: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key.slice(2), value]),
  );
const sources = {
  components: keys(components),
  templates: keys(components) as Record<
    string,
    { default?: ComponentType<IDesignTemplateProps> }
  >,
  markdown: keys(markdown),
  files: new Set(Object.keys(keys(files))),
};
const local = resolveDesignLayoutView(
  parseDesignLayout(layoutSource, "startup")!,
  sources,
);
const meta = {
  title: "Verification/Design extensions",
  component: DesignRenderer,
  parameters: { layout: "fullscreen" },
  args: {
    layout: local,
    data: resolvedProjectDesignData(designWorkspaces),
    confirmation: documentConfirmation("# Design", "startup"),
  },
} satisfies Meta<typeof DesignRenderer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomTemplate: Story = {};
export const CustomSections: Story = {
  args: { layout: { ...local, Template: undefined, template: undefined } },
};
export const EntirelyCustom: Story = {
  args: { data: undefined, layout: { ...local, sections: [] } },
};
export const Inherited: Story = { args: { layout: designLayouts.default } };
