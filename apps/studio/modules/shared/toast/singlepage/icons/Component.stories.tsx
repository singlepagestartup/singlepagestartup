import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Toast } from "../..";
const meta = {
  id: "modules-shared-toast-singlepage-icons",
  title: "Modules/Shared/Toast/Singlepage/Icons",
  component: Toast,
  parameters: { layout: "fullscreen", toastCatalog: true },
  args: { variant: "icons" },
  argTypes: { variant: { control: false, table: { disable: true } } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Toast>, { variant: "icons" }>
>;
export default meta;
export const Collection: StoryObj<typeof meta> = {};
