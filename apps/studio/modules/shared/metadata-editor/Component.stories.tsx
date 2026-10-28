import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Component } from "./Component";
import type { IEntityMetadata } from "@sps/shared-utils/metadata";
const meta = {
  title: "Shared/Metadata editor",
  component: Component,
  args: { value: {} },
  render: (args) => {
    const [value, setValue] = useState<IEntityMetadata>(args.value);
    return <Component {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Article: Story = {
  args: {
    language: "ru",
    value: {
      seo: {
        title: { ru: "Как выбрать помещение", en: "Choosing a property" },
        keywords: { ru: ["недвижимость", "помещение"] },
      },
      campaign: { source: "editorial" },
    },
  },
};
export const Product: Story = {
  args: {
    value: {
      seo: { description: { en: "Commercial property for your business" } },
      attributes: { city: "Moscow" },
    },
  },
};
export const Profile: Story = {
  args: { value: { seo: { title: { en: "Alex — property consultant" } } } },
};
