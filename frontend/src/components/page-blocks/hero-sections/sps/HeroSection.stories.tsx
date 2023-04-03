import { Meta, StoryObj } from "@storybook/react";
import HeroSections from "..";
import { SimpleCentered as SpsLiteSimpleCentered } from "../sps-lite/HeroSection.stories";

const meta = { component: HeroSections } satisfies Meta<typeof HeroSections>;
export default meta;

type Story = StoryObj<typeof meta>;

export const SimpleCentered: Story = {
  args: SpsLiteSimpleCentered.args,
};

export const Split: Story = {
  args: {
    ...SimpleCentered.args,
    variant: `split`,
  },
};
