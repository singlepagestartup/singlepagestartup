"use client";
import { Component as FileStorageModuleFile } from "../../../../file-storage/file/index";
import { memo, useCallback, useId } from "react";
import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import { MarkdownField } from "../ai-chat-document/MarkdownField";

import {
  sourceUserContext,
  sourceMaterials,
} from "../../../../../workspace/utils/products/ai-chat-knowledge";
import { useSource } from "../ai-chat-document/Source";

export interface ISourceCardProps {
  discussing?: boolean;
  onDiscuss?: () => void;
}
export const Component = memo(function Component({
  discussing = false,
  onDiscuss,
}: ISourceCardProps) {
  const { source: data, fileIds, edit: onEdit, attach, detach } = useSource();
  const id = useId();
  const edit = useCallback(
    (_: string, value: string) => onEdit(value),
    [onEdit],
  );
  const materials = sourceMaterials(data.content);
  return (
    <article
      data-module="knowledge"
      data-model="source"
      data-id={data.id}
      data-variant="ai-chat-card"
      data-ds-block="knowledge.source.ai-chat-card"
      aria-label={data.title}
      className="rounded-xl border border-sps-line bg-sps-white p-3"
    >
      <MarkdownField
        id={id}
        label={data.title}
        section={data.title}
        value={sourceUserContext(data.content)}
        placeholder={data.description ?? "Add your context and notes."}
        onChange={edit}
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
      {onDiscuss && (
        <button
          type="button"
          onClick={onDiscuss}
          className={`${kit.plain} mt-1 min-h-9 px-0 text-xs`}
        >
          <Icon name="chat-circle" className="size-4" />
          {discussing ? "Discussing in chat" : "Discuss this section"}
        </button>
      )}
      <FileStorageModuleFile
        variant="ai-chat-attachments"
        section={data.title}
        fileIds={fileIds}
        onAttach={attach}
        onRemove={detach}
      />
    </article>
  );
});
