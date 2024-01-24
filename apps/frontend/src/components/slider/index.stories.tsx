import type { Meta, StoryObj } from "@storybook/react";
import Root from ".";
import { entity } from "@sps/sps-website-builder/lib/redux/services/api/slider/mock/sps-lite";

const meta = {
  component: Root,
} satisfies Meta<typeof Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FadeWithPreviews: Story = {
  args: { ...entity, variant: "fade-with-previews" },
};
