"use client";
import { memo, useCallback, useId } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import { MarkdownField } from "../ai-chat-editor/MarkdownField";
import { Component as SourceFiles } from "../../../../relations/sources-to-file-storage-module-files/singlepage/ai-chat-find/index";
import { Component as ProjectSectionAssets } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/index";
import {
  sourceUserContext,
  sourceMaterials,
  editSourceUserContext,
  sourceAttachmentAssets,
} from "../../../../../../workspace/utils/products/ai-chat-knowledge";
import type {
  IAIChatSource,
  IAIChatFile,
  ISourceFileRelation,
  ISourceAttachmentView,
} from "../../../../../../workspace/utils/products/ai-chat-models";
import type { IProjectFile } from "../../../../../../workspace/utils/products/ai-chat-workspace";

export interface ISourceSectionProps {
  data: IAIChatSource;
  label?: string;
  discussing: boolean;
  files: IAIChatFile[];
  fileRelations: ISourceFileRelation[];
  attachmentViews: ISourceAttachmentView[];
  availableFiles: IProjectFile[];
  onEdit: (sourceId: string, content: string) => void;
  onDiscuss: (sourceId: string) => void;
  onAttach: (file: IProjectFile, sourceId: string) => void;
  onUpload: (files: IProjectFile[], sourceId: string) => void;
  onAssetRemove: (fileId: string, sourceId: string) => void;
  helpLabel?: string;
  onHelp?: (button: HTMLButtonElement, title: string) => void;
}

export const Component = memo(function Component({
  data,
  label = data.title,
  discussing,
  files,
  fileRelations,
  attachmentViews,
  availableFiles,
  onEdit,
  onDiscuss,
  onAttach,
  onUpload,
  onAssetRemove,
  helpLabel,
  onHelp,
}: ISourceSectionProps) {
  const id = useId();
  const edit = useCallback(
    (_: string, value: string) =>
      onEdit(data.id, editSourceUserContext(data.content, value)),
    [data.id, data.content, onEdit],
  );
  const attach = useCallback(
    (file: IProjectFile, _: string) => onAttach(file, data.id),
    [data.id, onAttach],
  );
  const upload = useCallback(
    (files: IProjectFile[], _: string) => onUpload(files, data.id),
    [data.id, onUpload],
  );
  const materials = sourceMaterials(data.content);
  return (
    <article
      data-module="knowledge"
      data-model="source"
      data-id={data.id}
      data-variant="ai-chat-section"
      data-ds-block="knowledge.source.ai-chat-section"
      aria-label={data.title}
      className="rounded-xl border border-sps-line bg-sps-white p-3"
    >
      <MarkdownField
        id={id}
        label={label}
        section={data.title}
        value={sourceUserContext(data.content)}
        placeholder={data.description ?? "Add your context and notes."}
        onChange={edit}
        helpLabel={helpLabel}
        onHelp={onHelp}
      />
      {materials && (
        <details className="mt-3 rounded-lg border border-sps-line p-3 text-xs">
          <summary className={`min-h-9 cursor-pointer ${kit.focus}`}>
            Analyzed materials
          </summary>
          <MarkdownDocument
            disableRawHTML
            externalLinksNewTab
            className="text-sm leading-6"
          >
            {materials}
          </MarkdownDocument>
        </details>
      )}
      <button
        type="button"
        onClick={() => onDiscuss(data.id)}
        className={`${kit.plain} mt-1 min-h-9 px-0 text-xs`}
      >
        <Icon name="chat-circle" className="size-4" />
        {discussing ? "Discussing in chat" : "Discuss this section"}
      </button>
      <SourceFiles
        variant="find"
        data={fileRelations}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "sourceId", method: "eq", value: data.id }],
            },
          },
        }}
      >
        {(relations) => (
          <ProjectSectionAssets
            section={data.title}
            assets={sourceAttachmentAssets(
              data.title,
              relations,
              files,
              attachmentViews,
            )}
            sources={availableFiles}
            onAttach={attach}
            onUpload={upload}
            onRemove={(fileId) => onAssetRemove(fileId, data.id)}
          />
        )}
      </SourceFiles>
    </article>
  );
});
