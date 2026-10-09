import { Component as ProfilesToKnowledgeModuleSources } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <ProfilesToKnowledgeModuleSources
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
    </ProfilesToKnowledgeModuleSources>
  );
}

const meta = {
  id: "modules-social-relations-profiles-to-knowledge-module-sources-singlepage-ai-chat-find",
  title:
    "Modules/Social/Relations/Profiles-To-Knowledge-Module-Sources/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
