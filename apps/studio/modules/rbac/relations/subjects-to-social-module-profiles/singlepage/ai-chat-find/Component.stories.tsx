import { Component as SubjectsToSocialModuleProfiles } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <SubjectsToSocialModuleProfiles
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
    </SubjectsToSocialModuleProfiles>
  );
}

const meta = {
  id: "modules-rbac-relations-subjects-to-social-module-profiles-singlepage-ai-chat-find",
  title:
    "Modules/Rbac/Relations/Subjects-To-Social-Module-Profiles/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
