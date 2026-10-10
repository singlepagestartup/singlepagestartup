import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link,
  List,
  Monitor,
  Save,
} from "../../../../../workspace/utils/components/ModuleIcons";
import {
  Button,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";

export function WebsiteBuilderAdminV2RichEditor() {
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
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] p-5 sm:p-6">
        <div>
          <p className={`text-sm ${kit.muted}`}>Page content</p>
          <h2 className="mt-1 text-2xl font-semibold">Content editor</h2>
        </div>
        <Button
          disabled={!editor}
          onClick={() =>
            setStatus("Saved in this preview. Changes reset on reload.")
          }
        >
          <Save className="size-5" />
          Save changes
        </Button>
      </header>
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <div
            className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--workspace-brand-background)] p-2"
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
                className={`grid size-11 place-items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${active ? "bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]" : "text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-surface)]"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={run}
              >
                <Icon className="size-5" />
              </button>
            ))}
          </div>
          {linkOpen && (
            <form
              className="mb-4 grid gap-3 rounded-2xl bg-[var(--workspace-brand-background)] p-4"
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
                <p
                  role="alert"
                  className="text-sm text-[var(--workspace-brand-danger)]"
                >
                  {linkError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Apply link</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    editor?.chain().focus().unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  Remove link
                </Button>
                <Button variant="plain" onClick={() => setLinkOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          <div
            className={`mx-auto min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] p-5 transition-[max-width] sm:p-6 ${preview === "mobile" ? "max-w-sm" : "max-w-none"} [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-7 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_p]:my-4 [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_blockquote]:rounded-xl [&_.ProseMirror_blockquote]:bg-[var(--workspace-brand-background)] [&_.ProseMirror_blockquote]:p-4`}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
        <aside className="self-start rounded-2xl bg-[var(--workspace-brand-background)] p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Monitor className="size-5" />
            Preview width
          </h3>
          <fieldset className="mt-4 grid gap-2">
            <legend className="sr-only">Preview width</legend>
            {["desktop", "mobile"].map((value) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl p-3 text-sm ${preview === value ? "bg-[var(--workspace-brand-surface)] font-semibold" : kit.muted}`}
              >
                <input
                  type="radio"
                  name="editor-preview-width"
                  value={value}
                  checked={preview === value}
                  onChange={() => setPreview(value)}
                  className="size-4 accent-[var(--workspace-brand-foreground)]"
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
