import type {
  IProjectProfile,
  IProjectMessage,
  IProjectFile,
} from "./ai-chat-workspace";
import type { IAIChatSource } from "./ai-chat-models";

export interface IAIChatThread {
  id: string;
  slug: string;
  title: string;
  variant: "ai-chat-products";
}
interface IThreadExchange {
  ids: { user: string; assistant: string };
  text: string;
  source: IAIChatSource;
  files: IProjectFile[];
  sourceFiles: IProjectFile[];
  workingOn: "whole" | "source";
  agent: import("./ai-chat-agents").IProjectAgent;
}
// Snapshot context when sending; later edits and detach must not rewrite history.
export function appendThreadExchange(
  messages: IProjectMessage[],
  exchange: IThreadExchange,
): IProjectMessage[] {
  const { ids, text, source, files, sourceFiles, workingOn, agent } = exchange;
  if (!text.trim() && !files.length) return messages;
  const scope = {
    documentName: "Products.md",
    sections: workingOn === "source" ? [source.title] : [],
  };
  const copyFile = (file: IProjectFile) => ({ ...file });
  return [
    ...messages,
    {
      id: ids.user,
      role: "user",
      text,
      files: files.map(copyFile),
      workingOn: { ...scope, sections: [...scope.sections] },
    },
    {
      id: ids.assistant,
      role: "assistant",
      agent: { ...agent },
      text: text
        ? "Local preview: check the proposed update before applying it to Products knowledge."
        : "Local preview: your files are attached to this message.",
      workingOn: scope,
      filesUsed: [
        ...new Map(
          [
            ...sourceFiles,
            ...messages.flatMap((message) => message.files ?? []),
            ...files,
          ].map((file) => [file.id, copyFile(file)]),
        ).values(),
      ],
      context: [
        {
          name: `Products.md · ${source.title}`,
          text: source.content,
          status: "draft",
        },
      ],
    },
  ];
}
