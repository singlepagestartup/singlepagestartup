import { Component as View } from "./index";
export function Component() {
  return (
    <div className="w-64 rounded-xl bg-sps-graphite p-4">
      <View
        data={{
          id: "brief",
          title: "Brief",
          reviewed: false,
          sources: [
            {
              id: "pottery:brief:customers",
              slug: "pottery:brief:customers-and-value",
              title: "Customers and value",
              content: "",
              variant: "ai-chat-section",
            },
          ],
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}
