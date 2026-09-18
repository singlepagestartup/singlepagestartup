import { documentConfirmation } from "../../../../../tools/studio/workspace/document";
import type { IWorkspacePageView } from "../pages";
import { MarkdownDocument } from "./ArtifactBrowser";
import { ConfirmationBadge } from "./DocumentStatus";
import { PresentationPdfDownload } from "./PresentationPdfDownload";

export function WorkspacePage({
  page,
  hideTitle = false,
  hideConfirmation = false,
  resolveLink,
}: {
  page: IWorkspacePageView;
  hideTitle?: boolean;
  hideConfirmation?: boolean;
  resolveLink?: (url: string) => string | { href: string; target: "_top" };
}) {
  const Component = page.Component;
  if (Component) {
    const content = (
      <div className="overflow-x-auto">
        <Component text={page.text} />
      </div>
    );
    return page.export === "pdf" ? (
      <PresentationPdfDownload fileName={`${page.id}.pdf`} title={page.title}>
        {content}
      </PresentationPdfDownload>
    ) : (
      content
    );
  }
  if (page.kind === "markdown")
    return (
      <article className="space-y-5 p-6 md:p-10">
        {!hideConfirmation && (
          <ConfirmationBadge
            confirmation={
              page.confirmation ??
              documentConfirmation(page.markdown ?? "", page.layer)
            }
          />
        )}
        <MarkdownDocument
          baseUrl={page.url}
          hideTitle={hideTitle}
          resolveLink={resolveLink}
        >
          {page.markdown ?? ""}
        </MarkdownDocument>
      </article>
    );
  // An inline fragment inherits the project's brand tokens and Tailwind build;
  // a standalone page stays isolated in its own document.
  if (page.kind === "html" && page.html !== undefined)
    return (
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: page.html }}
        data-workspace-html={page.id}
      />
    );
  if (page.kind === "html")
    return (
      <iframe
        title={page.title}
        src={page.url}
        sandbox="allow-scripts allow-downloads"
        className="min-h-[80vh] w-full border-0 bg-white"
      />
    );
  if (page.kind === "image")
    return (
      <figure className="p-6">
        <img
          alt={page.title}
          src={page.url}
          className="mx-auto max-h-[85vh] max-w-full object-contain"
        />
      </figure>
    );
  if (page.kind === "video")
    return (
      <video
        aria-label={page.title}
        src={page.url}
        controls
        className="max-h-[85vh] w-full"
      />
    );
  if (page.kind === "audio")
    return (
      <audio
        aria-label={page.title}
        src={page.url}
        controls
        className="m-6 max-w-full"
      />
    );
  return (
    <div className="p-6">
      <a className="text-teal-700 underline" href={page.url} download>
        {page.title} — Download file
      </a>
    </div>
  );
}
