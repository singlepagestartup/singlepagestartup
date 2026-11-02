import { Component as Thread } from "../..";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { SocialChatSettingsProps } from "./interface";
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
      <Thread
        {...args}
        open={open}
        onOpenChange={setOpen}
        threads={threads}
        onThreadsChange={setThreads}
        variant="chat-settings"
      />
    </>
  );
}
const meta = {
  id: "modules-social-models-thread-singlepage-chat-settings",
  title: "Modules/Social/Thread/Singlepage/chat-settings",
  component: Thread,
  args: {
    open: true,
    title: "General",
    description: "Local chat preview",
    profiles: defaultSocialProfiles,
    memberIds: ["james", "sarah"],
    threads: defaultSocialThreadListDefaultProps.threads,
    onOpenChange: () => {},
    onThreadsChange: () => {},
    variant: "chat-settings",
  },
  render: (args) => <Preview {...args} />,
} satisfies Meta<
  Extract<React.ComponentProps<typeof Thread>, { variant: "chat-settings" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
