import { Component as View } from "./index";
export function Component() {
  return (
    <View
      variant="find"
      data={[
        {
          id: "subject-profile",
          subjectId: "current-subject",
          socialModuleProfileId: "current-user",
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: "current-subject" },
            ],
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
