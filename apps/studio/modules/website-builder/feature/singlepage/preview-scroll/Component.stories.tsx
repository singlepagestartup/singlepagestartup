import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-feature-singlepage-preview-scroll",
  title: "Modules/Website-Builder/Feature/Singlepage/preview-scroll",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "preview-scroll",
    src: "/module-assets/images/singlepage/generated/framework-example-previews/contact.png",
    alt: "Страница вебинара: программа, запись и ведущий.",
    width: 340,
    height: 1908,
    label: "Пример страницы вебинара",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "preview-scroll" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
