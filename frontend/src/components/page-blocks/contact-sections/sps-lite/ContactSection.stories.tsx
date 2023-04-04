import { Meta, StoryObj } from "@storybook/react";
import ContactSectons from "..";
import { backendContactSectionBlockCentered } from "~mocks/components/page-blocks";

const meta = { component: ContactSectons } satisfies Meta<
  typeof ContactSectons
>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Centered: Story = {
  args: backendContactSectionBlockCentered,
};
