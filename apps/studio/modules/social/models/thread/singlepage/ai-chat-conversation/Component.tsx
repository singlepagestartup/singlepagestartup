import { Component as View } from "./index";
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
