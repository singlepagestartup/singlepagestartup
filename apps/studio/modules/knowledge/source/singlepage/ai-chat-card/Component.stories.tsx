import { Component as KnowledgeModuleSource } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../file-storage/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../ai-chat-document/Source";
import { aiChatProductsSourceFixture } from "../../../../../workspace/utils/products/ai-chat-workspace-fixture";
interface IExampleProps {
  empty?: boolean;
  withFiles?: boolean;
}
function Example({ empty = false, withFiles = false }: IExampleProps) {
  const { source, files, fileIds } = aiChatProductsSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={{ ...source, content: empty ? "" : source.content }}
        initialFileIds={withFiles ? fileIds : []}
      >
        <div className="mx-auto max-w-xl p-4">
          <KnowledgeModuleSource variant="ai-chat-card" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-card",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-card",
  component: Example,
  args: { empty: false, withFiles: false },
  argTypes: {
    empty: { control: "boolean" },
    withFiles: { control: "boolean" },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

export const Empty: StoryObj<typeof meta> = { args: { empty: true } };
export const WithFiles: StoryObj<typeof meta> = { args: { withFiles: true } };
