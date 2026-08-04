import Markdown from "markdown-to-jsx";

import type { IStudioArtifact, IStudioWorkspace } from "./types";

function ArtifactMetadata({ artifact }: { artifact: IStudioArtifact }) {
  return (
    <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-xs text-slate-600 md:grid-cols-3">
      <div>
        <span className="block font-semibold uppercase tracking-wide text-slate-900">
          Uses
        </span>
        {artifact.uses.length ? artifact.uses.join(", ") : "None"}
      </div>
      <div>
        <span className="block font-semibold uppercase tracking-wide text-slate-900">
          Used by
        </span>
        {artifact.usedBy.length ? artifact.usedBy.join(", ") : "None"}
      </div>
      <div>
        <span className="block font-semibold uppercase tracking-wide text-slate-900">
          Sources
        </span>
        <span className="grid gap-1">
          {artifact.sourcePaths.map((sourcePath) => (
            <code className="break-all" key={sourcePath}>
              {sourcePath}
            </code>
          ))}
        </span>
      </div>
    </div>
  );
}

function MarkdownDocument({ children }: { children: string }) {
  return (
    <div className="max-w-none text-[15px] leading-7 text-slate-700 [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-950 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-slate-950 [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
      <Markdown>{children}</Markdown>
    </div>
  );
}

function ArtifactContent({ artifact }: { artifact: IStudioArtifact }) {
  if (artifact.sourcePaths.some((sourcePath) => sourcePath.endsWith(".yaml"))) {
    return (
      <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-6 text-slate-100">
        <code>{artifact.content}</code>
      </pre>
    );
  }
  return <MarkdownDocument>{artifact.content}</MarkdownDocument>;
}

export function ArtifactDocument({
  workspace,
  kind,
}: {
  workspace: IStudioWorkspace;
  kind: IStudioArtifact["kind"];
}) {
  const artifact = workspace.artifacts.find(
    (candidate) => candidate.kind === kind,
  );
  const hasLocalContent = Boolean(artifact?.content.trim());
  if (!artifact || (workspace.id === "startup" && !hasLocalContent)) {
    const sourcePath = artifact?.sourcePaths[0];
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950 md:p-10">
        <section className="w-full max-w-3xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {workspace.label}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            No {kind} override
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            The startup layer is empty by default. current passes through the
            corresponding singlepage document until this source contains an
            explicit project override.
          </p>
          {sourcePath ? (
            <code className="mt-6 inline-block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
              {sourcePath}
            </code>
          ) : null}
        </section>
      </main>
    );
  }
  const resolutionLabel =
    workspace.id === "singlepage"
      ? "singlepage source"
      : workspace.id === "startup"
        ? "startup source"
        : artifact.resolution === "merged"
          ? "singlepage + startup"
          : artifact.resolution === "inherited"
            ? "Inherited from singlepage"
            : "Local project document";
  const projectionDescription =
    workspace.id === "current"
      ? "Studio shows the resolved current document. Edit the canonical source files listed below; this projection is read-only."
      : "Studio shows one source layer for comparison. Edit the canonical source file listed below; this projection is read-only.";
  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10">
      <header className="mx-auto mb-8 max-w-5xl rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="rounded-full bg-teal-400 px-3 py-1 text-slate-950">
            {artifact.kind}
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">
            {resolutionLabel}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          {artifact.id}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          {artifact.description}
        </p>
        <p className="mt-6 text-xs leading-5 text-slate-400">
          {projectionDescription}
        </p>
      </header>

      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-5 py-7 shadow-sm md:px-10 md:py-10">
        <ArtifactContent artifact={artifact} />
        <ArtifactMetadata artifact={artifact} />
      </section>
    </main>
  );
}
