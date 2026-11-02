import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-crm-models-request-singlepage-loading",
  title: "Modules/CRM/Request/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
