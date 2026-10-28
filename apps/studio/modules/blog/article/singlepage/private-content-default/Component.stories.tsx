import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-blog-models-article-singlepage-private-content-default",
  title: "Modules/Blog/Article/Singlepage/private-content-default",
  component: Model,
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: { access: "locked", variant: "private-content-default" },
  argTypes: {
    access: {
      control: "select",
      options: ["guest", "locked", "expired", "granted", "checking", "error"],
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "private-content-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Guest: Story = {
  args: {
    access: "guest",
    actionHref:
      "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method--default",
  },
};
export const Expired: Story = { args: { access: "expired" } };
export const Subscriber: Story = {
  args: {
    access: "granted",
    children: (
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold">Build the complete example</h3>
        <p className="leading-7">
          Subscriber resources, source code and implementation notes.
        </p>
      </div>
    ),
  },
};
export const Checking: Story = { args: { access: "checking" } };
export const Error: Story = { args: { access: "error" } };
