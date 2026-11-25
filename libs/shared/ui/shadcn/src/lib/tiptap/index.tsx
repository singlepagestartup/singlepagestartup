"use client";

import { cn, getRichTextEditorValue } from "@sps/shared-frontend-client-utils";
import { Node, mergeAttributes, type JSONContent } from "@tiptap/core";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ChangeEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { Toggle } from "../toggle";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link2Icon,
  Link2Off,
  Strikethrough,
  ClipboardCopy,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "../input";
import { Button } from "../button";
import { toast } from "sonner";
import { TipTapContent, type ITipTapContentProps } from "./content";
export { TipTapContent, type ITipTapContentProps } from "./content";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    copyButton: {
      insertCopyButton: (text: string) => ReturnType;
    };
  }
}

const CopyButton = Node.create({
  name: "copyButton",

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      text: {
        default: "Copy me!",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "button",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["button", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CopyButtonView);
  },

  addCommands() {
    return {
      insertCopyButton:
        (text: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { text },
          });
        },
    };
  },
});

function CopyButtonView({ node }) {
  const { text } = node.attrs;
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    setCopied(true);

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.info("Text copied to clipboard");
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((error: any) => {
        toast.error("Failed to copy text to clipboard", error?.message);
      });
  };

  return (
    <NodeViewWrapper as="span" className="inline-flex items-center">
      <Button
        type="button"
        onClick={copyText}
        variant="link"
        className="w-fit p-0"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </NodeViewWrapper>
  );
}

export default CopyButton;

export type ITipTapEditableProps = {
  value: string;
  name: string;
  form: UseFormReturn<any>;
  placeholder?: string;
  className?: string;
  editable: boolean;
  field: ControllerRenderProps<any, string>;
  onChange?: ChangeEventHandler<any>;
};

export type ITipTapProps = ITipTapEditableProps | ITipTapContentProps;

interface ITipTapEditorProps {
  value: string | JSONContent | JSONContent[];
  className?: string;
  language?: string;
  label?: string;
  disabled?: boolean;
  onValueChange: (value: string, empty: boolean) => void;
}

export function TipTapEditor(props: ITipTapEditorProps) {
  const ru = props.language === "ru";
  const content = useMemo(() => {
    if (typeof props.value !== "string") return props.value;
    const serialized = getRichTextEditorValue(props.value);
    return serialized ? (JSON.parse(serialized) as JSONContent) : "";
  }, [props.value]);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      CopyButton,
    ],
    content,
    editable: !props.disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        ...(props.label && { "aria-label": props.label }),
        class: cn(
          "prose dark:prose-invert w-full max-w-none min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring",
          props.className,
        ),
      },
    },
    onUpdate: ({ editor }) =>
      props.onValueChange(JSON.stringify(editor.getJSON()), editor.isEmpty),
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const matches = content
      ? JSON.stringify(content) === JSON.stringify(editor.getJSON())
      : editor.isEmpty;
    if (!matches) editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, content]);

  useEffect(() => {
    if (editor && editor.isEditable === Boolean(props.disabled))
      editor.setEditable(!props.disabled, false);
  }, [editor, props.disabled]);

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn("relative flex min-w-0 flex-col gap-1", props.className)}
    >
      {editor ? (
        <div className="flex max-w-full flex-wrap gap-1 rounded-lg bg-muted/40">
          <Toggle
            aria-label={ru ? "Заголовок 1" : "Heading 1"}
            data-state={editor.isActive("heading", { level: 1 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
            >
              <Heading1 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Заголовок 2" : "Heading 2"}
            data-state={editor.isActive("heading", { level: 2 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
            >
              <Heading2 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Заголовок 3" : "Heading 3"}
            data-state={editor.isActive("heading", { level: 3 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }}
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Заголовок 4" : "Heading 4"}
            data-state={editor.isActive("heading", { level: 4 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 4 }).run();
              }}
            >
              <Heading4 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Заголовок 5" : "Heading 5"}
            data-state={editor.isActive("heading", { level: 5 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 5 }).run();
              }}
            >
              <Heading5 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Заголовок 6" : "Heading 6"}
            data-state={editor.isActive("heading", { level: 6 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 6 }).run();
              }}
            >
              <Heading6 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Полужирный" : "Bold"}
            data-state={editor.isActive("bold") ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleBold().run();
              }}
            >
              <Bold className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Курсив" : "Italic"}
            data-state={editor.isActive("italic") ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleItalic().run();
              }}
            >
              <Italic className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label={ru ? "Зачёркнутый" : "Strikethrough"}
            data-state={editor.isActive("strike") ? "on" : "off"}
            asChild={true}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleStrike().run();
              }}
            >
              <Strikethrough className="h-4 w-4" />
            </button>
          </Toggle>

          {editor.isActive("link") ? (
            <Toggle
              aria-label={ru ? "Удалить ссылку" : "Remove link"}
              data-state="on"
              asChild={true}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();

                  editor.chain().focus().unsetLink().run();
                }}
              >
                <Link2Off className="h-4 w-4" />
              </button>
            </Toggle>
          ) : (
            <Toggle
              aria-label={ru ? "Добавить ссылку" : "Add link"}
              data-state="off"
              asChild={true}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();

                  setLink();
                }}
              >
                <Link2Icon className="h-4 w-4" />
              </button>
            </Toggle>
          )}
          <Button
            type="button"
            aria-label={ru ? "Кнопка копирования" : "Insert copy button"}
            onClick={() => {
              const text = window.prompt(
                ru ? "Текст для копирования" : "Text to copy",
              );
              if (text) {
                editor.chain().focus().insertCopyButton(text).run();
              }
            }}
            variant="outline"
            className="w-fit"
          >
            <ClipboardCopy className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

export const TipTapEditable = forwardRef<
  HTMLInputElement,
  ITipTapEditableProps
>(function TipTapEditable(props, ref) {
  return (
    <TipTapEditor
      value={props.value}
      className={props.className}
      onValueChange={(value) => props.form.setValue(props.name, value)}
    />
  );
});

export const TipTap = forwardRef<HTMLInputElement, ITipTapProps>(
  (props: ITipTapProps, ref) => {
    if ("editable" in props) {
      try {
        typeof props.value === "string" && props.value !== ""
          ? JSON.parse(props.value)
          : props.value;
      } catch (error) {
        console.log(
          "TipTap editor was replaced by text input, because of error:",
          error,
        );
        return (
          <Input
            value={props.value}
            onChange={props.onChange}
            className={props.className}
          />
        );
      }

      return (
        <TipTapEditable
          {...props}
          value={
            typeof props.value === "string" && props.value !== ""
              ? JSON.parse(props.value)
              : props.value
          }
          ref={ref}
        />
      );
    }

    return (
      <TipTapContent
        className={props.className}
        value={props.value}
        ref={ref}
      />
    );
  },
);
