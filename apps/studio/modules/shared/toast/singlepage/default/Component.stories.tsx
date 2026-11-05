import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Toast } from "../..";
const meta = {
  id: "modules-shared-toast-singlepage-default",
  title: "Modules/Shared/Toast/Singlepage/Default",
  component: Toast,
  parameters: { layout: "fullscreen", toastCatalog: true },
  args: {
    variant: "default",
    type: "success",
    title: "Profile saved",
    description: "Your profile changes have been saved.",
    actionLabel: "",
    persistent: true,
    duration: 4500,
    position: "bottom-right",
    appearance: "single",
  },
  argTypes: {
    variant: { control: false, table: { disable: true } },
    type: {
      control: "select",
      options: ["default", "success", "error", "warning", "info", "loading"],
    },
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
    },
    appearance: { control: "select", options: ["single", "all", "stacked"] },
    duration: { control: { type: "number", min: 1000, step: 500 } },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Toast>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { type: "default", title: "Document updated" },
};
export const Success: Story = {};
export const Error: Story = {
  args: {
    type: "error",
    title: "Profile could not be saved",
    description:
      "Check the connection and try again. Your changes are still in the form.",
  },
};
export const Warning: Story = {
  args: {
    type: "warning",
    title: "Review before continuing",
    description: "Some files have not finished uploading.",
  },
};
export const Info: Story = {
  args: {
    type: "info",
    title: "Your document is ready",
    description: "You can now open or download it.",
  },
};
export const Loading: Story = {
  args: {
    type: "loading",
    title: "Saving profile",
    description: "Your changes are being saved.",
  },
};
export const Action: Story = {
  args: {
    type: "info",
    title: "Your document is ready",
    description: "Open the document to review the saved changes.",
    actionLabel: "Open document",
  },
};
export const LongText: Story = {
  args: {
    type: "error",
    title:
      "The document could not be saved because its title is already used in this project",
    description:
      "Choose another title and try again. Your current document text and attachments remain available in the editor, so you can continue without entering the same information again.",
    actionLabel: "Try again",
  },
};
export const AllStates: Story = {
  args: {
    appearance: "all",
    description: "A notification using the current SPS theme.",
  },
};
export const Stacked: Story = { args: { appearance: "stacked" } };
export const AutoDismiss: Story = {
  args: { persistent: false, duration: 4500 },
};
