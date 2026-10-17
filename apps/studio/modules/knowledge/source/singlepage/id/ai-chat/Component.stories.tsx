import { Component as Source } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "./Source";
import {
  aiChatSourceFixture,
  aiChatAttachmentFixture,
} from "../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
interface IStoryProps {
  empty?: boolean;
  withFiles?: boolean;
  fileCount?: number;
}
function Component({
  empty = false,
  withFiles = false,
  fileCount = 2,
}: IStoryProps) {
  const { source } = aiChatSourceFixture();
  const files = aiChatAttachmentFixture(fileCount);
  const fileIds = files.map((file) => file.id);
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        key={`${empty}:${withFiles}:${fileCount}`}
        profileId="pottery"
        initialSource={{ ...source, content: empty ? "" : source.content }}
        initialFileIds={withFiles ? fileIds : []}
      >
        <div className="mx-auto max-w-xl p-4">
          <Source variant="id-ai-chat" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-id-ai-chat",
  title: "Modules/Knowledge/Source/Singlepage/id/ai-chat",
  component: Component,
  args: { empty: false, withFiles: false },
  argTypes: {
    empty: { control: "boolean" },
    withFiles: { control: "boolean" },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

export const Empty: StoryObj<typeof meta> = { args: { empty: true } };
export const WithFiles: StoryObj<typeof meta> = { args: { withFiles: true } };

export const ManyFiles: StoryObj<typeof meta> = {
  args: { withFiles: true, fileCount: 13 },
};
