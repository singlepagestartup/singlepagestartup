import type {
  IProjectMessage,
  IProjectFile,
} from "../../../../profile/singlepage/scope/ai-chat/project/state";
import type { IAIChatSource } from "../../../../profile/singlepage/scope/ai-chat/project/models";

export interface IAIChatThread {
  id: string;
  slug: string;
  title: string;
  variant: "overview-ai-chat";
}
interface IThreadExchange {
  ids: { user: string; assistant: string };
  text: string;
  documentName?: string;
  source: IAIChatSource;
  files: IProjectFile[];
  sourceFiles: IProjectFile[];
  workingOn: "whole" | "source";
  agent: import("../../../../profile/singlepage/agent/overview/ai-chat/agents").IProjectAgent;
}
// Snapshot context when sending; later edits and detach must not rewrite history.
export function appendThreadExchange(
  messages: IProjectMessage[],
  exchange: IThreadExchange,
): IProjectMessage[] {
  const { ids, text, source, files, sourceFiles, workingOn, agent } = exchange;
  const documentName = exchange.documentName ?? `${source.title}.md`;
  if (!text.trim() && !files.length) return messages;
  const scope = {
    documentName,
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
        ? `В этом примере проверьте предложенное изменение перед применением к документу «${source.title}».`
        : "В этом примере файлы прикреплены к сообщению.",
      files: files.map(copyFile),
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
          name: `${documentName} · ${source.title}`,
          text: source.content,
          status: "draft",
        },
      ],
    },
  ];
}

export function threadDocumentMarkdown(
  fileName: string,
  sources: IAIChatSource[],
): string {
  return `# ${fileName.replace(/\.md$/i, "")}\n\n${sources
    .map((source) => `## ${source.title}\n\n${source.content}`)
    .join("\n\n")}\n`;
}

export function reorderThreadAttachment(
  ids: string[],
  id: string,
  targetId: string,
): string[] {
  const from = ids.indexOf(id),
    to = ids.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return ids;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
export function moveThreadAttachment(
  ids: string[],
  id: string,
  direction: -1 | 1,
): string[] {
  const from = ids.indexOf(id),
    to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
