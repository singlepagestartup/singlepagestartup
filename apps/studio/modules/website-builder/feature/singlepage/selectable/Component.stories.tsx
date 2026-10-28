import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-feature-singlepage-selectable",
  title: "Modules/Website-Builder/Feature/Singlepage/selectable",
  component: Model,
  decorators: [
    (Story) => (
      <div className="bg-default p-6 text-default-foreground">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: {
    variant: "selectable",
    id: "contacts",
    title: "Сбор контактов",
    description:
      "Посетитель записывается на вебинар, а школа получает его заявку.",
    selected: true,
    controls: "preview",
    onSelect: () => {},
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "selectable" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
