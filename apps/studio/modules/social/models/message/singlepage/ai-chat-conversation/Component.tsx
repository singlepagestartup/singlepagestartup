import { Component as View } from "@sps/social/models/message/frontend/component/src/lib/singlepage/ai-chat-conversation";
export function Component() {
  return (
    <View
      messages={[
        { id: "welcome", role: "assistant", text: "Who is the workshop for?" },
        {
          id: "audience",
          role: "user",
          text: "Adults trying pottery for the first time.",
        },
      ]}
    />
  );
}
