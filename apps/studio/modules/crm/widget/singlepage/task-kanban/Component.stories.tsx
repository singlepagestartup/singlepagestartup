import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";

const release = demoWorkflows.releases[0];
const tasks = demoWorkflows.tasks.filter(
  (task) => task.workflowId === release.id && task.version === release.version,
);

const meta = {
  id: "modules-crm-models-widget-singlepage-task-kanban",
  title: "Modules/CRM/Widget/Singlepage/task-kanban",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    variant: "task-kanban",
    stages: release.stages,
    tasks,
    people: demoWorkflows.people,
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "task-kanban" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const PreviousVersion: Story = {
  args: {
    stages: demoWorkflows.releases[1].stages,
    tasks: demoWorkflows.tasks.filter((task) => task.version === 2),
  },
};
