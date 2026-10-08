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
              title: "Customers and value",
              content: "",
              documentId: "brief",
            },
          ],
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}
