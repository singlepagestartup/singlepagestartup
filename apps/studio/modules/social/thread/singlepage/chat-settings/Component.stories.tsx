import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Component, type SocialChatSettingsProps } from "./Component";
import {
  defaultSocialProfiles,
  defaultSocialThreadListDefaultProps,
} from "../list-default/Component";
function Preview(args: SocialChatSettingsProps) {
  const [open, setOpen] = useState(true);
  const [threads, setThreads] = useState(args.threads);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open chat settings</button>
      <Component
        {...args}
        open={open}
        onOpenChange={setOpen}
        threads={threads}
        onThreadsChange={setThreads}
      />
    </>
  );
}
const meta = {
  title: "Modules/Social/Models/Thread/Singlepage/chat-settings",
  component: Component,
  args: {
    open: true,
    title: "General",
    description: "Local chat preview",
    profiles: defaultSocialProfiles,
    memberIds: ["james", "sarah"],
    threads: defaultSocialThreadListDefaultProps.threads,
    onOpenChange: () => {},
    onThreadsChange: () => {},
  },
  render: (args) => <Preview {...args} />,
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
