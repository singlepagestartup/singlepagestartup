import { Component as File } from "../../index";
import { aiChatAttachmentFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import type { IAttachmentFileProps } from "./interface";
import type { Meta, StoryObj } from "@storybook/react";
function Component({ file }: IAttachmentFileProps) {
  return <File variant="attachment-ai-chat" file={file} />;
}
const files = aiChatAttachmentFixture(4);
const meta = {
  id: "modules-file-storage-models-file-singlepage-attachment-ai-chat",
  title: "Modules/File-Storage/File/Singlepage/attachment-ai-chat",
  component: Component,
  args: { file: files[0] },
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Document: StoryObj<typeof meta> = { args: { file: files[3] } };
export const LongName: StoryObj<typeof meta> = {
  args: {
    file: {
      ...files[0],
      name: "Workshop-reference-with-a-long-descriptive-filename.jpg",
    },
  },
};
