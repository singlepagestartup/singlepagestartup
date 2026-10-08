import { Component as View } from "./index";
export function Component() {
  return (
    <View
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
    </View>
  );
}
