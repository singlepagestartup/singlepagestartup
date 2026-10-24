"use client";
import type { IComponentProps, ContentRichProps } from "./interface";
export type { ContentRichProps } from "./interface";
/**
 * website-builder.widget.content-rich
 *
 * Renders a rich-text HTML body with the shared prose styling. Part of the
 * website-builder content family (model: widget). Display components compose
 * this via import to render article/page body content.
 */
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function Component(props?: IComponentProps) {
  const content = props?.content ?? "";
  const editor = useEditor(
    {
      editable: false,
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Link.configure({
          autolink: false,
          openOnClick: true,
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: "max-w-none outline-none",
        },
      },
    },
    [content],
  );

  return (
    <article
      data-ds-block="website-builder.widget.content-rich"
      data-ds-layer="singlepage"
      className="min-w-0 max-w-none text-base leading-7 text-foreground
        [&_.ProseMirror_p]:mb-6 [&_.ProseMirror_p]:text-base [&_.ProseMirror_p]:leading-7 [&_.ProseMirror_p]:text-foreground
        [&_.ProseMirror_h1]:mb-6 [&_.ProseMirror_h1]:mt-12 [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:leading-tight
        [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-12 [&_.ProseMirror_h2]:text-[2rem] [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h2]:tracking-normal
        [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-8 [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:leading-8
        [&_.ProseMirror_blockquote]:my-8 [&_.ProseMirror_blockquote]:rounded-2xl [&_.ProseMirror_blockquote]:bg-default [&_.ProseMirror_blockquote]:p-6 [&_.ProseMirror_blockquote]:text-default-foreground [&_.ProseMirror_blockquote]:not-italic sm:[&_.ProseMirror_blockquote]:p-8
        [&_.ProseMirror_blockquote_p]:mb-0 [&_.ProseMirror_blockquote_p]:text-lg [&_.ProseMirror_blockquote_p]:leading-8 [&_.ProseMirror_blockquote_p]:text-default-foreground [&_.ProseMirror_blockquote_strong]:text-default-foreground
        [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_strong]:text-foreground
        [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-foreground [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_a]:decoration-muted-foreground [&_.ProseMirror_a]:focus-visible:outline-2 [&_.ProseMirror_a]:focus-visible:outline-offset-2 [&_.ProseMirror_a]:focus-visible:outline-foreground
        [&_.ProseMirror_ul]:mb-6 [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:space-y-3 [&_.ProseMirror_ol]:mb-6 [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:space-y-3 [&_.ProseMirror_li]:pl-1 [&_.ProseMirror_li]:text-base [&_.ProseMirror_li]:leading-7 [&_.ProseMirror_li_p]:mb-0
        [&_.ProseMirror_code]:rounded-md [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm
        [&_.ProseMirror_pre]:my-8 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-2xl [&_.ProseMirror_pre]:bg-default [&_.ProseMirror_pre]:p-6
        [&_.ProseMirror_pre_code]:border-0 [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-sm [&_.ProseMirror_pre_code]:text-default-muted-foreground
        [&_.ProseMirror_hr]:my-10 [&_.ProseMirror_hr]:border-border"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-rich"}
    >
      <EditorContent editor={editor} />
    </article>
  );
}
