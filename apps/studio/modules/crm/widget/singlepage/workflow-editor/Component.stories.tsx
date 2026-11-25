import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";
import { newStage } from "../../../shared/workflows";

const workflow = demoWorkflows.workflows[0];

const meta = {
  id: "modules-crm-models-widget-singlepage-workflow-editor",
  title: "Modules/CRM/Widget/Singlepage/workflow-editor",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    variant: "workflow-editor",
    initialWorkflow: workflow,
    people: demoWorkflows.people,
    payers: demoWorkflows.payers,
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "workflow-editor" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const NewWorkflow: Story = {
  args: {
    initialWorkflow: {
      id: "draft",
      shopId: "forma",
      title: "",
      applicability: "",
      goal: "",
      stages: [newStage("first-stage")],
    },
  },
};

export const WithoutEmployees: Story = {
  args: { ...NewWorkflow.args, people: [] },
};
