import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-host-models-metadata-singlepage-loading",
  title: "Modules/Host/Metadata/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
