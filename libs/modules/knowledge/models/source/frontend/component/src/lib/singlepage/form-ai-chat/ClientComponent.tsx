"use client";
import { memo, useEffect, useId, useRef, useState } from "react";
import Markdown from "markdown-to-jsx";
import { MessageCircle, Upload } from "lucide-react";
import type { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  AI_CHAT_ATTACHMENT_ACCEPT,
  assertSupportedAiChatAttachments,
  readKnowledgeUserContext,
  readKnowledgeMaterials,
  readKnowledgeDocumentContent,
  replaceKnowledgeUserContext,
} from "@sps/shared-utils";

export const Component = memo(function Component(props: IClientComponentProps) {
  const id = useId();
  const [title, setTitle] = useState(props.data?.title ?? props.title ?? "");
  const [content, setContent] = useState(
    props.data?.content || props.content || "",
  );
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const saved = props.data;
  const notes = readKnowledgeUserContext(content);
  const materials = readKnowledgeMaterials(content);
  const dirty = useRef(false);
  useEffect(() => {
    if (saved) {
      if (!dirty.current) setTitle(saved.title);
      setContent((current) =>
        dirty.current
          ? replaceKnowledgeUserContext(
              saved.content,
              readKnowledgeUserContext(current),
            )
          : saved.content,
      );
    }
  }, [saved?.title, saved?.content]);
  async function save() {
    setPending(true);
    setStatus("");
    try {
      const result = await props.onSave({ title, content });
      dirty.current = false;
      setStatus(result || "Saved");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Save failed. Your last saved document stays in place.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <article
      data-module="knowledge"
      data-model="source"
      data-variant={props.variant}
      data-id={saved?.id}
      aria-label={`${title} knowledge`}
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card p-3",
        props.data?.className,
        props.className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <input
            aria-label="Knowledge section title"
            placeholder="Name this knowledge"
            className="min-h-10 min-w-0 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            value={title}
            onChange={(event) => {
              dirty.current = true;
              setTitle(event.target.value);
              setStatus("");
            }}
            disabled={pending}
            maxLength={200}
          />
        </div>
        <div className="flex rounded-lg bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            className={`min-h-8 rounded-md px-2 ${!preview ? "bg-card" : "text-muted-foreground"}`}
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            Editor
          </button>
          <button
            type="button"
            className={`min-h-8 rounded-md px-2 ${preview ? "bg-card" : "text-muted-foreground"}`}
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
      </div>
      <label className="sr-only" htmlFor={id}>
        {title} content
      </label>
      {preview ? (
        <div className="prose min-h-44 max-w-none break-words rounded-xl border border-border p-3 text-sm">
          <Markdown options={{ disableParsingRawHTML: true }}>
            {readKnowledgeDocumentContent(content) || "No knowledge saved yet."}
          </Markdown>
        </div>
      ) : (
        <textarea
          id={id}
          disabled={pending}
          className="min-h-44 w-full resize-y rounded-xl border border-border bg-card p-3 font-mono text-sm leading-6 text-muted-foreground focus:outline-2"
          placeholder={props.placeholder || "Add knowledge for this section."}
          value={notes}
          onChange={(event) => {
            dirty.current = true;
            setContent(
              replaceKnowledgeUserContext(content, event.target.value),
            );
            setStatus("");
          }}
        />
      )}
      {!preview && materials && (
        <details className="mt-2 rounded-xl border border-border p-3 text-sm">
          <summary className="cursor-pointer font-semibold">
            Analyzed materials
          </summary>
          <div className="prose mt-3 max-w-none break-words text-sm">
            <Markdown options={{ disableParsingRawHTML: true }}>
              {materials}
            </Markdown>
          </div>
        </details>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {props.onDiscuss && (
          <button
            type="button"
            onClick={props.onDiscuss}
            className="flex min-h-10 items-center gap-2 text-xs font-semibold text-muted-foreground"
          >
            <MessageCircle className="size-4" />
            Discuss this section
          </button>
        )}
        <button
          type="button"
          disabled={
            pending ||
            !content.trim() ||
            !title.trim() ||
            (content === saved?.content && title === saved?.title)
          }
          onClick={save}
          className="min-h-10 rounded-xl bg-primary text-primary-foreground px-3 text-xs font-semibold disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save knowledge"}
        </button>
      </div>
      {status && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {status}
        </p>
      )}
      {saved && saved.contentHash !== saved.indexedContentHash && (
        <p role="status" className="mt-2 text-xs text-destructive">
          Saved; this version is not indexed for AI retrieval yet.
        </p>
      )}
      {props.attachments}
      {props.onAttach && (
        <label className="mt-4 flex min-h-10 cursor-pointer items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
          <Upload className="size-4" />
          Upload files
          <input
            aria-label={`Upload files for ${title}`}
            type="file"
            accept={AI_CHAT_ATTACHMENT_ACCEPT}
            multiple
            className="sr-only"
            disabled={pending}
            onChange={async (event) => {
              const input = event.currentTarget;
              const files = input.files;
              if (!files?.length) return;
              setPending(true);
              try {
                assertSupportedAiChatAttachments(Array.from(files));
                if (saved && dirty.current) {
                  await props.onSave({ title, content });
                  dirty.current = false;
                }
                const result = await props.onAttach!(files);
                setStatus(result || "Files saved");
              } catch (error) {
                setStatus(
                  error instanceof Error ? error.message : "Upload failed",
                );
              } finally {
                input.value = "";
                setPending(false);
              }
            }}
          />
        </label>
      )}
    </article>
  );
});
