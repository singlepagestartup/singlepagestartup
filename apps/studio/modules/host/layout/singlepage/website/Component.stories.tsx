import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/Host/Models/Layout/Singlepage/website",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="text-3xl font-semibold">Page content</h1>
      </main>
    ),
    footer: "compact",
    signedIn: false,
  },
  argTypes: {
    signedIn: { control: "boolean" },
    footer: { control: "select", options: ["compact", "default"] },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Authenticated: StoryObj<typeof meta> = {
  args: { signedIn: true },
};
