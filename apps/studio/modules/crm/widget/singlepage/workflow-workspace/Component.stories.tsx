import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";

const meta = {
  id: "modules-crm-models-widget-singlepage-workflow-workspace",
  title: "Modules/CRM/Widget/Singlepage/workflow-workspace",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "workflow-workspace",
    fixture: demoWorkflows,
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "workflow-workspace" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Waiting: Story = { args: { scenario: "waiting" } };
export const Conflict: Story = { args: { scenario: "conflict" } };
export const Empty: Story = { args: { scenario: "empty" } };
export const Error: Story = { args: { scenario: "error" } };
export const Forbidden: Story = { args: { scenario: "forbidden" } };
