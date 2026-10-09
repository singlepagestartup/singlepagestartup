"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import { MarkdownDocument } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

export interface IMarkdownFieldProps {
  id: string;
  label: string;
  section: string;
  value: string;
  placeholder: string;
  onChange: (section: string, value: string) => void;
  helpLabel?: string;
  onHelp?: (button: HTMLButtonElement, section: string) => void;
}

export const MarkdownField = memo(function MarkdownField({
  id,
  label,
  section,
  value,
  placeholder,
  onChange,
  helpLabel,
  onHelp,
}: IMarkdownFieldProps) {
  const [mode, setMode] = useState<"editor" | "preview">(
    value.trim() ? "preview" : "editor",
  );
  const textarea = useRef<HTMLTextAreaElement>(null);
  const focusEditor = useRef(false);

  useLayoutEffect(() => {
    if (mode === "editor" && focusEditor.current) {
      textarea.current?.focus();
      focusEditor.current = false;
    }
  }, [mode]);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <label htmlFor={id} className={kit.label}>
            {section}
          </label>
          {onHelp && (
            <button
              type="button"
              aria-label={helpLabel ?? `About ${section}`}
              aria-haspopup="dialog"
              onClick={(event) => onHelp(event.currentTarget, section)}
              className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 text-sps-muted hover:text-sps-graphite focus:outline-none ${kit.focus}`}
            >
              <Icon name="question" className="size-4" />
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label={`${label} display`}
          className="flex rounded-lg bg-sps-grey p-1"
        >
          {(["editor", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`${label}: ${option === "editor" ? "Editor" : "Preview"}`}
              aria-pressed={mode === option}
              aria-controls={option === "editor" ? id : `${id}-preview`}
              onClick={() => {
                focusEditor.current = option === "editor";
                setMode(option);
                if (mode === "editor" && option === "editor")
                  textarea.current?.focus();
              }}
              className={`min-h-7 rounded-md px-2 text-xs font-semibold ${kit.focus} ${mode === option ? "bg-sps-white text-sps-graphite" : kit.muted}`}
            >
              {option === "editor" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>
      </div>
      <textarea
        ref={textarea}
        id={id}
        hidden={mode !== "editor"}
        rows={6}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(section, event.target.value)}
        placeholder={placeholder}
        className={`${kit.field} resize-y font-mono text-sm leading-6`}
      />
      {mode === "preview" && (
        <div
          id={`${id}-preview`}
          role="region"
          aria-label={`${label} preview`}
          className="min-h-32 min-w-0 rounded-xl border border-sps-line px-3 py-2"
        >
          {value.trim() ? (
            <MarkdownDocument
              disableRawHTML
              externalLinksNewTab
              className="text-sm leading-6 [&_h1]:mb-3 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:text-lg [&_h3]:mt-4 [&_p]:my-2 [&_pre]:rounded-lg [&_pre]:p-3"
            >
              {value}
            </MarkdownDocument>
          ) : (
            <p className={`text-sm leading-6 ${kit.muted}`}>{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
});
