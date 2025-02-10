"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChangeEventHandler, forwardRef, useCallback, useState } from "react";
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
      <Button onClick={copyText} variant="link" className="w-fit p-0">
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

export type ITipTapContentProps = {
  value: string;
  className?: string;
};

export type ITipTapProps = ITipTapEditableProps | ITipTapContentProps;

export const TipTapEditable = forwardRef<
  HTMLInputElement,
  ITipTapEditableProps
>((props: ITipTapEditableProps, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      CopyButton,
    ],
    content: props.value,
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert prose-xs lg:prose-base p-5 focus:outline-none w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          props.className,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const editorJson = editor?.getJSON();
      props.form.setValue(props.name, JSON.stringify(editorJson));
    },
  });

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
    <div className="relative flex flex-col gap-1">
      {editor ? (
        <div className="rounded-lg bg-white flex gap-1 max-w-full">
          <Toggle
            aria-label="Toggle Heading 1"
            data-state={editor.isActive("heading", { level: 1 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
            >
              <Heading1 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle heading 2"
            data-state={editor.isActive("heading", { level: 2 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
            >
              <Heading2 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle heading 3"
            data-state={editor.isActive("heading", { level: 3 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }}
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle heading 4"
            data-state={editor.isActive("heading", { level: 4 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 4 }).run();
              }}
            >
              <Heading4 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle heading 5"
            data-state={editor.isActive("heading", { level: 5 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 5 }).run();
              }}
            >
              <Heading5 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle heading 6"
            data-state={editor.isActive("heading", { level: 6 }) ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleHeading({ level: 6 }).run();
              }}
            >
              <Heading6 className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle bold"
            data-state={editor.isActive("bold") ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleBold().run();
              }}
            >
              <Bold className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle italic"
            data-state={editor.isActive("italic") ? "on" : "off"}
            asChild={true}
          >
            <button
              onClick={(e) => {
                e.preventDefault();

                editor.chain().focus().toggleItalic().run();
              }}
            >
              <Italic className="h-4 w-4" />
            </button>
          </Toggle>
          <Toggle
            aria-label="Toggle strike"
            data-state={editor.isActive("strike") ? "on" : "off"}
            asChild={true}
          >
            <button
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
              aria-label="Toggle strike"
              data-state={editor.isActive("strike") ? "on" : "off"}
              asChild={true}
            >
              <button
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
              aria-label="Toggle strike"
              data-state={editor.isActive("strike") ? "on" : "off"}
              asChild={true}
            >
              <button
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
            onClick={() => {
              const text = window.prompt("Type text to copy", "Copy me!");
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
});

export const TipTapContent = forwardRef<HTMLDivElement, ITipTapContentProps>(
  (props: ITipTapContentProps, ref) => {
    const editor = useEditor({
      extensions: [StarterKit, Link, CopyButton],
      content: props.value,
      editorProps: {
        attributes: {
          class: cn("w-full prose mx-auto focus:outline-none", props.className),
        },
      },
      editable: false,
      immediatelyRender: false,
    });

    if (!editor) {
      return;
    }

    return <EditorContent editor={editor} />;
  },
);

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

    try {
      typeof props.value === "string" && props.value !== ""
        ? JSON.parse(props.value)
        : props.value;
    } catch (error) {
      console.log(
        "TipTap editor was replaced by text input, because of error:",
        error,
      );
      if (typeof props.value === "string") {
        return <p>{props.value}</p>;
      }

      return null;
    }

    return (
      <TipTapContent
        {...props}
        value={
          typeof props.value === "string" && props.value !== ""
            ? JSON.parse(props.value)
            : props.value
        }
        ref={ref}
      />
    );
  },
);
