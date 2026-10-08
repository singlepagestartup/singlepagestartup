import { Component as View } from "./index";
export function Component() {
  return (
    <div className="w-64 rounded-xl bg-sps-graphite p-4">
      <View
        data={{
          id: "work-chat",
          title: "Workshop campaign",
          variant: "ai-chat-work",
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}
