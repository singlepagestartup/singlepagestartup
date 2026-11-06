import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Button } from "../../../button/index";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function WebsiteBuilderAdminV2RichEditor({
  variant = "admin-v2-rich-editor",
}: IComponentProps = {}) {
  const [preview, setPreview] = useState("desktop");
  const [status, setStatus] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [, refreshToolbar] = useState(0);
  const editor = useEditor({
    extensions: [StarterKit, LinkExtension.configure({ openOnClick: false })],
    content:
      "<h2>Your next chapter starts here.</h2><p>Bring your notes, documents and ideas together. Give your project a clear direction, one useful decision at a time.</p><ul><li>Keep your own words.</li><li>Add the details that matter.</li><li>Review before sharing.</li></ul>",
    editorProps: {
      attributes: {
        class: "min-h-80 outline-none",
        role: "textbox",
        "aria-label": "Rich text content",
        "aria-multiline": "true",
      },
    },
    onUpdate: () => setStatus("Unsaved changes"),
    onSelectionUpdate: () => refreshToolbar((value) => value + 1),
    onTransaction: () => refreshToolbar((value) => value + 1),
  });
  const commands = [
    {
      label: "Bold",
      icon: Bold,
      active: editor?.isActive("bold"),
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor?.isActive("italic"),
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Bullet list",
      icon: List,
      active: editor?.isActive("bulletList"),
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Add link",
      icon: Link,
      active: editor?.isActive("link"),
      run: () => {
        setLinkUrl(editor?.getAttributes("link").href ?? "");
        setLinkError("");
        setLinkOpen((open) => !open);
      },
    },
  ];
  return (
    <section
      className={`${kit.card} overflow-hidden`}
      data-ds-block="website-builder.widget.admin-v2-rich-editor"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div>
          <p className={`text-sm ${kit.muted}`}>Page content</p>
          <h2 className="mt-1 text-2xl font-semibold">Content editor</h2>
        </div>
        <ToolbarButton
          disabled={!editor}
          onClick={() =>
            setStatus("Saved in this preview. Changes reset on reload.")
          }
        >
          <Save className="size-5" />
          Save changes
        </ToolbarButton>
      </header>
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <div
            className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-muted p-2"
            role="toolbar"
            aria-label="Formatting"
          >
            {commands.map(({ label, icon: Icon, active, run }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={Boolean(active)}
                disabled={!editor}
                className={`grid size-11 place-items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${active ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={run}
              >
                <Icon className="size-5" />
              </button>
            ))}
          </div>
          {linkOpen && (
            <form
              className="mb-4 grid gap-3 rounded-2xl bg-muted p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!/^https?:\/\//i.test(linkUrl)) {
                  setLinkError(
                    "Enter a URL beginning with https:// or http://.",
                  );
                  return;
                }
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: linkUrl })
                  .run();
                setLinkOpen(false);
              }}
            >
              <label className="grid gap-2 text-sm font-semibold">
                Link URL
                <input
                  className={kit.field}
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  aria-invalid={Boolean(linkError)}
                />
              </label>
              {linkError && (
                <p role="alert" className="text-sm text-destructive">
                  {linkError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <ToolbarButton type="submit">Apply link</ToolbarButton>
                <ToolbarButton
                  variant="secondary"
                  onClick={() => {
                    editor?.chain().focus().unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  Remove link
                </ToolbarButton>
                <ToolbarButton
                  variant="plain"
                  onClick={() => setLinkOpen(false)}
                >
                  Cancel
                </ToolbarButton>
              </div>
            </form>
          )}
          <div
            className={`mx-auto min-w-0 rounded-2xl border border-border p-5 transition-[max-width] sm:p-6 ${preview === "mobile" ? "max-w-sm" : "max-w-none"} [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-7 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_p]:my-4 [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_blockquote]:rounded-xl [&_.ProseMirror_blockquote]:bg-muted [&_.ProseMirror_blockquote]:p-4`}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
        <aside className="self-start rounded-2xl bg-muted p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Monitor className="size-5" />
            Preview width
          </h3>
          <fieldset className="mt-4 grid gap-2">
            <legend className="sr-only">Preview width</legend>
            {["desktop", "mobile"].map((value) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl p-3 text-sm ${preview === value ? "bg-card font-semibold" : kit.muted}`}
              >
                <input
                  type="radio"
                  name="editor-preview-width"
                  value={value}
                  checked={preview === value}
                  onChange={() => setPreview(value)}
                  className="size-4 accent-foreground"
                />
                {value === "desktop" ? "Desktop" : "Mobile"}
              </label>
            ))}
          </fieldset>
          <p className={`mt-5 text-sm leading-6 ${kit.muted}`}>
            Edit text and formatting here. Your changes stay in this preview.
          </p>
          <p className="mt-4 text-sm font-medium" role="status">
            {status || "Ready to edit"}
          </p>
        </aside>
      </div>
    </section>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
};
const Save = createIcon("floppy-disk");
const Monitor = createIcon("monitor");
const List = createIcon("list");
const Link = createIcon("link");
const Italic = createIcon("text-italic");
const Bold = createIcon("text-b");
const ToolbarButton = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function ToolbarButton({ variant = "primary", ...props }, ref) {
  return <Button {...props} variant="control" appearance={variant} ref={ref} />;
});
