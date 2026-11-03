import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignWorkspace } from "../components/DesignWorkspace";
const meta = {
  id: "workspace-design-default",
  title: "Workspace/40 Дизайн/default",
  component: DesignWorkspace,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { projection: "default" },
} satisfies Meta<typeof DesignWorkspace>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Document: Story = { name: "Дизайн" };
