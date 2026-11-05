import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Icon } from "../..";
const meta = {
  id: "modules-shared-icon-singlepage-custom",
  title: "Modules/Shared/Icon/Singlepage/Custom",
  component: Icon,
  args: { variant: "custom", name: "star-fill" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Icon>, { variant: "custom" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
