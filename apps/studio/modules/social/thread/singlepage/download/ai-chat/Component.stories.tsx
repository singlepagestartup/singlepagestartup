import type { Meta, StoryObj } from "@storybook/react";
import { Component as Thread } from "../../../index";
import type { IThreadDownloadProps } from "./interface";

function Component(props: IThreadDownloadProps) {
  return <Thread {...props} variant="download-ai-chat" />;
}
const meta = {
  id: "modules-social-models-thread-singlepage-download-ai-chat",
  title: "Modules/Social/Thread/Singlepage/download/ai-chat",
  component: Component,
  args: {
    threadId: "pottery:products:products:thread",
    fileName: "Products.md",
    sources: [
      {
        id: "products",
        slug: "products",
        variant: "id-ai-chat",
        title: "Products",
        content: "Weekend pottery workshops.",
      },
      {
        id: "customers",
        slug: "customers",
        variant: "id-ai-chat",
        title: "Customers",
        content: "Small groups of beginners.",
      },
    ],
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
