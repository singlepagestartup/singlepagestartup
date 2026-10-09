import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <Component
      variant="find"
      data={[
        {
          id: "profile-chat",
          profileId: "current-user",
          chatId: "pottery:project-chat",
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: "current-user" }],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </Component>
  );
}

const meta = {
  id: "modules-social-relations-profiles-to-chats-singlepage-ai-chat-find",
  title: "Modules/Social/Relations/Profiles-To-Chats/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
