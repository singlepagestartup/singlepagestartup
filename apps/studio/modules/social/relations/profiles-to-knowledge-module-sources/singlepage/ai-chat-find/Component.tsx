import { Component as View } from "./index";
export function Component() {
  return (
    <View
      variant="find"
      data={[
        {
          id: "profile-source",
          profileId: "pottery",
          knowledgeModuleSourceId: "pottery:brief:customers",
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: "pottery" }],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </View>
  );
}
