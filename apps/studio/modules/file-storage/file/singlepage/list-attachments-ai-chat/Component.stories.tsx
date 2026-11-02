import { Component as File } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { FilesProvider } from "./Files";
import { aiChatAttachmentFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
interface IStoryProps {
  count?: number;
  expanded?: boolean;
  removing?: boolean;
  error?: boolean;
  analyzing?: boolean;
}
function Attachments({
  count = 2,
  expanded = false,
  removing = false,
  error = false,
  analyzing = false,
}: IStoryProps) {
  const files = aiChatAttachmentFixture(count);
  const [ids, setIds] = useState(files.map((file) => file.id));
  const attach = useCallback(
    (next: string[]) =>
      setIds((current) => [...new Set([...current, ...next])]),
    [],
  );
  const remove = useCallback(
    (id: string) =>
      setIds((current) => current.filter((value) => value !== id)),
    [],
  );
  return (
    <FilesProvider initialFiles={files}>
      <div className="mx-auto w-full max-w-sm p-4">
        <File
          variant="list-attachments-ai-chat"
          section="Products"
          fileIds={ids}
          onAttach={attach}
          onRemove={remove}
          initialExpanded={expanded}
          pendingFileId={removing ? files[0]?.id : null}
          errorMessage={error ? "File could not be removed. Try again." : ""}
          statusMessage={
            analyzing ? "File removed. Analyzing remaining files…" : ""
          }
        />
      </div>
    </FilesProvider>
  );
}
function Component(props: IStoryProps) {
  return <Attachments key={JSON.stringify(props)} {...props} />;
}
const meta = {
  id: "modules-file-storage-models-file-singlepage-list-attachments-ai-chat",
  title: "Modules/File-Storage/File/Singlepage/list-attachments-ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    count: 2,
    expanded: false,
    removing: false,
    error: false,
    analyzing: false,
  },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 20 } },
    expanded: { control: "boolean" },
    removing: { control: "boolean" },
    error: { control: "boolean" },
    analyzing: { control: "boolean" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = { args: { count: 0 } };
export const ManyFiles: StoryObj<typeof meta> = { args: { count: 13 } };
export const Expanded: StoryObj<typeof meta> = {
  args: { count: 13, expanded: true },
};
export const Removing: StoryObj<typeof meta> = {
  args: { count: 13, removing: true },
};
export const RemovalError: StoryObj<typeof meta> = {
  args: { count: 13, error: true },
};
export const Analyzing: StoryObj<typeof meta> = {
  args: { count: 13, analyzing: true },
};
