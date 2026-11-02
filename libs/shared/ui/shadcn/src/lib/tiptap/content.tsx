"use client";

import type { JSONContent } from "@tiptap/core";
import {
  type ReactNode,
  Fragment,
  createElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "../button";

export interface ITipTapContentProps {
  value: string | JSONContent | JSONContent[];
  className?: string;
}

function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
      toast.info("Text copied to clipboard");
    } catch {
      toast.error("Failed to copy text to clipboard");
    }
  }

  return (
    <span className="inline-flex items-center">
      <Button
        type="button"
        onClick={copyText}
        variant="link"
        className="w-fit p-0"
        aria-label={copied ? "Text copied" : "Copy text"}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </span>
  );
}

function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) {
    return undefined;
  }

  try {
    const url = new URL(value, "https://relative.invalid");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function renderMarks(node: JSONContent): ReactNode {
  let content: ReactNode = typeof node.text === "string" ? node.text : "";

  for (const mark of Array.isArray(node.marks) ? node.marks : []) {
    if (!mark || typeof mark !== "object") continue;

    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "strike":
        content = <s>{content}</s>;
        break;
      case "code":
        content = <code>{content}</code>;
        break;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (!href) break;
        const target = mark.attrs?.target === "_blank" ? "_blank" : undefined;
        const storedRel =
          typeof mark.attrs?.rel === "string"
            ? mark.attrs.rel.split(/\s+/)
            : [];
        const rel = Array.from(
          new Set([
            ...storedRel.filter((value) =>
              [
                "nofollow",
                "sponsored",
                "ugc",
                "noopener",
                "noreferrer",
              ].includes(value),
            ),
            ...(target ? ["noopener", "noreferrer"] : []),
          ]),
        ).join(" ");
        content = (
          <a href={href} target={target} rel={rel || undefined}>
            {content}
          </a>
        );
        break;
      }
    }
  }

  return content;
}

function renderNode(node: JSONContent, depth = 0): ReactNode {
  if (!node || typeof node !== "object" || depth > 100) return null;
  if (node.type === "text") return renderMarks(node);

  const children = Array.isArray(node.content)
    ? node.content.map((child, index) => (
        <Fragment key={index}>{renderNode(child, depth + 1)}</Fragment>
      ))
    : null;

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return <p>{children?.length ? children : <br />}</p>;
    case "heading": {
      const level = Number(node.attrs?.level);
      return createElement(
        `h${Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2}`,
        null,
        children,
      );
    }
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList": {
      const start = Number(node.attrs?.start);
      return (
        <ol
          start={Number.isSafeInteger(start) && start > 1 ? start : undefined}
        >
          {children}
        </ol>
      );
    }
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "codeBlock": {
      const language = node.attrs?.language;
      return (
        <pre>
          <code
            className={
              typeof language === "string" && /^[\w-]+$/.test(language)
                ? `language-${language}`
                : undefined
            }
          >
            {children}
          </code>
        </pre>
      );
    }
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr />;
    case "copyButton":
      return (
        <CopyTextButton
          text={typeof node.attrs?.text === "string" ? node.attrs.text : ""}
        />
      );
    default:
      return children;
  }
}

/** Read-only content is identical on the server and during hydration. */
export const TipTapContent = forwardRef<HTMLDivElement, ITipTapContentProps>(
  function TipTapContent({ value, className }, ref) {
    let content: ITipTapContentProps["value"] = value;
    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
          content = parsed as JSONContent | JSONContent[];
        }
      } catch {
        // Legacy plain text remains visible and React escapes its markup.
      }
    }

    return (
      <div
        ref={ref}
        className={cn("w-full prose mx-auto focus:outline-hidden", className)}
      >
        {typeof content === "string" ? (
          <p>{content}</p>
        ) : Array.isArray(content) ? (
          content.map((node, index) => (
            <Fragment key={index}>{renderNode(node)}</Fragment>
          ))
        ) : (
          renderNode(content)
        )}
      </div>
    );
  },
);
