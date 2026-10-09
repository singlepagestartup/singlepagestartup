import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <Component
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
    </Component>
  );
}

const meta = {
  id: "modules-knowledge-relations-sources-to-file-storage-module-files-singlepage-ai-chat-find",
  title:
    "Modules/Knowledge/Relations/Sources-To-File-Storage-Module-Files/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
