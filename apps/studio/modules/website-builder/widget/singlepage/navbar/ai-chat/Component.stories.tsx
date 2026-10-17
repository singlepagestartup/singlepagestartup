import { Component as Widget, type INavbarAiChatProps } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Component(props: INavbarAiChatProps) {
  return (
    <div className="@container min-h-56 font-default">
      <Widget {...props} variant="navbar-ai-chat" />
    </div>
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-navbar-ai-chat",
  title: "Modules/Website-Builder/Widget/Singlepage/navbar/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    buttonsArrayId: "ai-chat-help",
    activeHref: "/ai-chat/help",
    navigationLayout: "collapsible",
    navigationLabel: "Navigation",
    profileSelect: ({ onNavigate }) => (
      <button type="button" onClick={onNavigate} className="min-h-11 px-3">
        Profile Select slot
      </button>
    ),
    subjectAccount: () => (
      <button type="button" className="min-h-11 px-3">
        Subject Account slot
      </button>
    ),
  },
  argTypes: {
    buttonsArrayId: {
      control: "select",
      options: [
        "ai-chat-help",
        "ai-chat-login",
        "ai-chat-register",
        "ai-chat-try",
      ],
    },
    navigationLayout: {
      control: "select",
      options: ["collapsible", "inline"],
    },
    activeHref: { control: "text" },
    navigationLabel: { control: "text" },
    profileSelect: { control: false },
    subjectAccount: { control: false },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Inline: StoryObj<typeof meta> = {
  args: {
    buttonsArrayId: "ai-chat-register",
    activeHref: undefined,
    navigationLayout: "inline",
    profileSelect: undefined,
    subjectAccount: undefined,
  },
};
