import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { Component as Widget } from "../..";
import { demoWorkflows } from "../../../shared/demo-workflows";

const workflow = demoWorkflows.workflows[0];
const task = demoWorkflows.tasks.find((task) => task.id === "CRM-124")!;

const meta = {
  id: "modules-crm-models-widget-singlepage-task-detail",
  title: "Modules/CRM/Widget/Singlepage/task-detail",
  component: Widget,
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <Widget
        {...args}
        onAssign={(assignee) =>
          updateArgs({
            task: { ...args.task, assignee, revision: args.task.revision + 1 },
          })
        }
      />
    );
  },
  parameters: { layout: "padded" },
  args: {
    variant: "task-detail",
    task,
    workflow,
    people: demoWorkflows.people,
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "task-detail" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Customer: Story = { args: { audience: "customer" } };
export const RestrictedConversation: Story = {
  args: { canReadConversation: false },
};
export const LongNames: Story = {
  args: {
    task: {
      ...task,
      label:
        "Обложка для каталога коллекции дизайнерской мебели и предметов интерьера",
      customer: "Анна Александровна Ковалёва-Петровская",
    },
    people: demoWorkflows.people.map((person) =>
      person.id === task.assignee
        ? {
            ...person,
            name: "Ассистент по подготовке иллюстраций для каталога",
          }
        : person,
    ),
  },
};
export const Unassigned: Story = {
  args: {
    task: {
      ...task,
      assignee: "",
      assignments: [],
      assignmentCandidateIds: [],
      thread: undefined,
    },
  },
};
