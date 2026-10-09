"use client";
import { useCallback, useRef, useState } from "react";
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
  type IProjectFile,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import {
  AI_CHAT_DOCUMENT_GUIDES,
  projectDocumentGuide,
} from "../../../../../../workspace/utils/products/ai-chat-content";
import { Component as SourceSection } from "../ai-chat-section/index";
import type {
  IAIChatSource,
  IAIChatFile,
  ISourceFileRelation,
  ISourceAttachmentView,
} from "../../../../../../workspace/utils/products/ai-chat-models";
import { DocumentGuide, type IDocumentGuideProps } from "./DocumentGuide";

export interface IDocumentEditorProps {
  document: IProjectDocument;
  data: IAIChatSource[];
  files: IAIChatFile[];
  fileRelations: ISourceFileRelation[];
  attachmentViews: ISourceAttachmentView[];
  sections: string[];
  onSection: (section: string) => void;
  onEdit: (section: string, text: string) => void;
  onReview: () => void;
  sources: IProjectFile[];
  onAttach: (
    file: IProjectFile,
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onUpload: (
    files: IProjectFile[],
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onAssetChange: (id: string, update: Partial<IProjectAsset>) => void;
  onAssetRemove: (id: string) => void;
}

export function Component({
  document,
  data,
  files,
  fileRelations,
  attachmentViews,
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
  const sourceTitle = useCallback(
    (sourceId: string) => data.find((source) => source.id === sourceId)?.title,
    [data],
  );
  const editSource = useCallback(
    (sourceId: string, content: string) => {
      const title = sourceTitle(sourceId);
      if (title) onEdit(title, content);
    },
    [sourceTitle, onEdit],
  );
  const discussSource = useCallback(
    (sourceId: string) => {
      const title = sourceTitle(sourceId);
      if (title) onSection(title);
    },
    [sourceTitle, onSection],
  );
  const attachSourceFile = useCallback(
    (file: IProjectFile, sourceId: string, kind: IProjectAsset["kind"]) => {
      const title = sourceTitle(sourceId);
      if (title) onAttach(file, title, kind);
    },
    [sourceTitle, onAttach],
  );
  const uploadSourceFiles = useCallback(
    (files: IProjectFile[], sourceId: string, kind: IProjectAsset["kind"]) => {
      const title = sourceTitle(sourceId);
      if (title) onUpload(files, title, kind);
    },
    [sourceTitle, onUpload],
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
        {data.map((source) => (
          <SourceSection
            key={source.id}
            data={source}
            label={`${document.title}: ${source.title}`}
            discussing={sections.includes(source.title)}
            files={files}
            fileRelations={fileRelations}
            attachmentViews={attachmentViews}
            availableFiles={sources}
            onEdit={editSource}
            onDiscuss={discussSource}
            onAttach={attachSourceFile}
            onUpload={uploadSourceFiles}
            onAssetChange={onAssetChange}
            onAssetRemove={onAssetRemove}
            helpLabel={`About ${document.title}.md: ${source.title}`}
            onHelp={guide?.sections[source.title] ? openGuide : undefined}
          />
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
