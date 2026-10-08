"use client";
import { useCallback, useId, useRef, useState } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  isDocumentReviewed,
  projectDocumentText,
  type IProjectDocument,
  type IProjectAsset,
  type IProjectSource,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import {
  AI_CHAT_DOCUMENT_GUIDES,
  projectDocumentGuide,
} from "../../../../../../workspace/utils/products/ai-chat-content";
import { ProjectSectionAssets } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/View";
import { DocumentGuide, type IDocumentGuideProps } from "./DocumentGuide";
import { MarkdownField } from "./MarkdownField";

export interface IDocumentEditorProps {
  document: IProjectDocument;
  sections: string[];
  onSection: (section: string) => void;
  onEdit: (section: string, text: string) => void;
  onReview: () => void;
  sources: IProjectSource[];
  onAttach: (
    file: IProjectSource,
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onUpload: (
    files: IProjectSource[],
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onAssetChange: (id: string, update: Partial<IProjectAsset>) => void;
  onAssetRemove: (id: string) => void;
}

export function ProjectSourceEditor({
  document,
  sections,
  onSection,
  onEdit,
  onReview,
  sources,
  onAttach,
  onUpload,
  onAssetChange,
  onAssetRemove,
}: IDocumentEditorProps) {
  const id = useId();
  const reviewed = isDocumentReviewed(document);
  const guide = projectDocumentGuide(AI_CHAT_DOCUMENT_GUIDES, document.id);
  const [openedGuide, setOpenedGuide] =
    useState<IDocumentGuideProps["guide"]>(null);
  const guideTrigger = useRef<HTMLButtonElement | null>(null);
  const openGuide = useCallback(
    (button: HTMLButtonElement, section?: string) => {
      const body = section ? guide?.sections[section] : guide?.body;
      if (!body) return;
      guideTrigger.current = button;
      setOpenedGuide({
        title: section ?? `${document.title}.md`,
        body,
        basis: section ? guide?.basis : undefined,
      });
    },
    [guide, document.title],
  );
  function downloadDocument() {
    const url = URL.createObjectURL(
      new Blob([projectDocumentText(document)], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.title}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      aria-label={`${document.title}.md editor`}
      className="min-w-0 bg-sps-grey p-4"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h3 className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Icon name="file-text" />
            {document.title}.md
          </h3>
          {guide && (
            <button
              type="button"
              aria-label={`About ${document.title}.md`}
              aria-haspopup="dialog"
              onClick={(event) => openGuide(event.currentTarget)}
              className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 text-sps-muted hover:text-sps-graphite focus:outline-none ${kit.focus}`}
            >
              <Icon name="question" className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${kit.muted}`}>
            {reviewed
              ? "Reviewed"
              : document.saved
                ? "Changes to review"
                : "Draft"}
          </span>
          <Button
            variant="secondary"
            aria-label={`Download ${document.title}.md`}
            onClick={downloadDocument}
          >
            <Icon name="arrow-down" />
            .md
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {document.sections.map((field, index) => (
          <div
            key={field.title}
            className="rounded-xl border border-sps-line bg-sps-white p-3"
          >
            <MarkdownField
              key={`${document.id}-${field.title}`}
              id={`${id}-${index}`}
              label={`${document.title}: ${field.title}`}
              section={field.title}
              value={document.values[field.title] ?? ""}
              onChange={onEdit}
              helpLabel={`About ${document.title}.md: ${field.title}`}
              onHelp={guide?.sections[field.title] ? openGuide : undefined}
              placeholder={field.prompt}
            />
            <button
              type="button"
              onClick={() => onSection(field.title)}
              className={`${kit.plain} mt-1 min-h-9 px-0 text-xs`}
            >
              <Icon name="chat-circle" className="size-4" />
              {sections.includes(field.title)
                ? "Discussing in chat"
                : "Discuss this section"}
            </button>
            <ProjectSectionAssets
              section={field.title}
              assets={(document.assets ?? []).filter(
                (asset) => asset.section === field.title,
              )}
              sources={sources}
              onAttach={onAttach}
              onUpload={onUpload}
              onChange={onAssetChange}
              onRemove={onAssetRemove}
            />
          </div>
        ))}
      </div>
      <Button
        className="mt-4 w-full"
        disabled={
          reviewed ||
          (!Object.values(document.values).some((text) => text.trim()) &&
            !document.assets?.length)
        }
        onClick={onReview}
      >
        <Icon name="check" />
        {reviewed ? "Version reviewed" : "Save reviewed version"}
      </Button>
      <DocumentGuide
        guide={openedGuide}
        onClose={() => setOpenedGuide(null)}
        onReturnFocus={() => guideTrigger.current?.focus()}
      />
    </section>
  );
}
