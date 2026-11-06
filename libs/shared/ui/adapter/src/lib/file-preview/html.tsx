"use client";

import { useMemo } from "react";
import { FILE_PREVIEW_HTML_CSP } from "@sps/shared-utils";
import type { IHtmlPreviewProps } from "./interface";

export function HtmlPreview({ text, language }: IHtmlPreviewProps) {
  const document = useMemo(() => {
    // The outer document owns frame-src so the attachment cannot navigate
    // its own frame to an authenticated page or remove the inherited policy.
    const url = "data:text/html;charset=utf-8," + encodeURIComponent(text);
    return [
      "<!doctype html>",
      '<meta name="referrer" content="no-referrer">',
      `<meta http-equiv="Content-Security-Policy" content="${FILE_PREVIEW_HTML_CSP}">`,
      "<style>html,body,iframe{margin:0;width:100%;height:100%;border:0;display:block}</style>",
      `<iframe title="HTML" sandbox="allow-scripts" referrerpolicy="no-referrer" src="${url}"></iframe>`,
    ].join("");
  }, [text]);

  return (
    <iframe
      title={language === "ru" ? "Предпросмотр HTML" : "HTML preview"}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={document}
      className="min-h-0 w-full flex-1 border-0 bg-white"
    />
  );
}
