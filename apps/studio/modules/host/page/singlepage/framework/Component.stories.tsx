import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-framework",
  title: "Modules/Host/Page/Singlepage/framework",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "framework" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "framework" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Introduction: Story = { args: { showExamples: false } };
