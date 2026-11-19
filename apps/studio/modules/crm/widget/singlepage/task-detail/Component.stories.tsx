import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";

const release = demoWorkflows.releases[0];
const task = demoWorkflows.tasks.find((task) => task.id === "CRM-124")!;

const meta = {
  id: "modules-crm-models-widget-singlepage-task-detail",
  title: "Modules/CRM/Widget/Singlepage/task-detail",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    variant: "task-detail",
    task,
    release,
    people: demoWorkflows.people,
    canReadCosts: true,
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "task-detail" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Customer: Story = { args: { audience: "customer" } };
export const WithoutCostPermission: Story = { args: { canReadCosts: false } };
