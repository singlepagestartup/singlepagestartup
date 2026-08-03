import Markdown from "markdown-to-jsx";

import type {
  IEngineeringArtifact,
  IStudioArtifact,
  IStudioWorkspace,
} from "./types";

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
          Canonical source
        </span>
        <code className="break-all">{artifact.sourcePath}</code>
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

export function ArtifactBrowser({
  workspace,
}: {
  workspace: IStudioWorkspace;
}) {
  const localCount = workspace.artifacts.filter(
    (artifact) => !artifact.inherited,
  ).length;
  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10">
      <header className="mx-auto mb-8 max-w-6xl rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="rounded-full bg-teal-400 px-3 py-1 text-slate-950">
            {workspace.activeLayer}
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">
            read-only projection
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          {workspace.label}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          Studio renders validated canonical artifacts. Editing remains in the
          indexed Markdown/YAML sources; inheritance is limited to explicit
          imports.
        </p>
        <dl className="mt-7 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Local
            </dt>
            <dd className="text-2xl font-semibold">{localCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Inherited
            </dt>
            <dd className="text-2xl font-semibold">
              {workspace.artifacts.length - localCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Imports
            </dt>
            <dd className="text-2xl font-semibold">
              {workspace.imports.length}
            </dd>
          </div>
        </dl>
        <code className="mt-6 block break-all text-xs text-slate-400">
          {workspace.workspaceRoot}
        </code>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4">
        {workspace.artifacts.map((artifact, index) => (
          <details
            key={artifact.id}
            open={index < 8}
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-5 p-5 md:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-semibold text-teal-800">
                    {artifact.id}
                  </code>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {artifact.kind}
                  </span>
                  {artifact.inherited && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                      inherited
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {artifact.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="text-2xl text-slate-400 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-7 md:px-8">
              <MarkdownDocument>{artifact.content}</MarkdownDocument>
              <ArtifactMetadata artifact={artifact} />
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}

export function EngineeringBrowser({
  kind,
  artifacts,
}: {
  kind: "research" | "plan";
  artifacts: IEngineeringArtifact[];
}) {
  const selected = artifacts.filter((artifact) => artifact.kind === kind);
  return (
    <main className="min-h-screen bg-stone-100 p-5 text-slate-950 md:p-10">
      <header className="mx-auto mb-7 max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Engineering · read-only
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {kind === "research" ? "Research" : "Plans"}
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Path-stable projections from <code>thoughts/shared/{kind}/**</code>.
          Studio does not move or edit engineering artifacts.
        </p>
      </header>
      <section className="mx-auto grid max-w-6xl gap-4">
        {selected.map((artifact, index) => (
          <details
            key={artifact.sourcePath}
            open={index === 0}
            className="rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            <summary className="cursor-pointer p-5 md:p-6">
              <h2 className="font-semibold">{artifact.title}</h2>
              <code className="mt-2 block text-xs text-slate-500">
                {artifact.sourcePath}
              </code>
            </summary>
            <div className="border-t border-stone-100 p-5 md:p-8">
              <MarkdownDocument>{artifact.content}</MarkdownDocument>
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}
