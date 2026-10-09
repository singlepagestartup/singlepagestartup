import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/Rbac/Models/Subject/Singlepage/navbar-account",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { signedIn: false },
  argTypes: { signedIn: { control: "boolean" } },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Authenticated: StoryObj<typeof meta> = {
  args: { signedIn: true },
};
