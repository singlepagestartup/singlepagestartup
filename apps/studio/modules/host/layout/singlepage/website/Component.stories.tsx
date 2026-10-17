import { Component as Layout } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-layout-singlepage-website",
  title: "Modules/Host/Layout/Singlepage/website",
  component: Layout,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="text-3xl font-semibold">Page content</h1>
      </main>
    ),
    footer: "compact",
    signedIn: false,
    variant: "website",
  },
  argTypes: {
    signedIn: { control: "boolean" },
    footer: { control: "select", options: ["compact", "default"] },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "website" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Authenticated: StoryObj<typeof meta> = {
  args: { signedIn: true },
};
