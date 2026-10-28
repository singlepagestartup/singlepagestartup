"use client";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { readKnowledgeDocumentContent } from "@sps/shared-utils";
export function Component(props: IComponentPropsExtended) {
  const project = props.project;

  const thread = props.thread;
  const document = getAIChatDocument(thread.metadata);
  const sources = {
    ...props.sourcesRead,
    refetch: props.sourcesRead.refetch || (() => window.location.reload()),
  };
  const documentSources =
    document?.profileId === project.profile.id
      ? (sources.data || []).filter((source) =>
          document.sourceIds.includes(source.id),
        )
      : [];
  const download = () => {
    const blob = new Blob(
      [
        `# ${thread.title}\n\n` +
          documentSources
            .map(
              (source) =>
                `## ${source.title}\n\n${readKnowledgeDocumentContent(source.content)}`,
            )
            .join("\n\n"),
      ],
      { type: "text/markdown;charset=utf-8" },
    );
    const href = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = href;
    link.download = thread.title?.endsWith(".md")
      ? thread.title
      : `${thread.title}.md`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <SocialModuleThread
      language={props.language}
      isServer={false}
      variant="download-ai-chat"
      data={thread}
      dataSource="props"
      onDownload={download}
      pending={sources.isPending || !!sources.error}
    />
  );
}
