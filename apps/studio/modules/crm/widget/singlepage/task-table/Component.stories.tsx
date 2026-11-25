import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";

const workflow = demoWorkflows.workflows[0];
const tasks = demoWorkflows.tasks.filter(
  (task) => task.workflowId === workflow.id,
);

const meta = {
  id: "modules-crm-models-widget-singlepage-task-table",
  title: "Modules/CRM/Widget/Singlepage/task-table",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    variant: "task-table",
    stages: workflow.stages,
    tasks,
    people: demoWorkflows.people,
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "task-table" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
