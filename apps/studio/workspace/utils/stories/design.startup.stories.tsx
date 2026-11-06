import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignWorkspace } from "../components/DesignWorkspace";

const meta = {
  id: "workspace-design-startup",
  title: "Workspace/40 Дизайн/startup",
  component: DesignWorkspace,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { projection: "startup" },
} satisfies Meta<typeof DesignWorkspace>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Document: Story = { name: "Дизайн" };
export const Resolved: Story = {
  name: "С учётом наследования",
  tags: ["!dev", "!test"],
  args: { projection: "default" },
};
