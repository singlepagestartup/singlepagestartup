import { Component as View } from "./index";
export function Component() {
  return (
    <View
      variant="find"
      data={[
        {
          id: "source:file",
          sourceId: "source",
          fileStorageModuleFileId: "file",
          orderIndex: 0,
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "sourceId", method: "eq", value: "source" }],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </View>
  );
}
