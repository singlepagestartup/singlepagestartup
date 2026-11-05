import {
  canonicalHeading,
  localizedHeading,
} from "../../../../../tools/studio/workspace/headings";
import Markdown from "markdown-to-jsx";
import { useRef } from "react";
import { documentReviewBody } from "../../../../../tools/studio/workspace/document";
import { DocumentHeader, documentPurpose } from "./DocumentHeader";
import { DocumentDownloads } from "./DocumentDownloads";

import type { IStudioArtifact, IStudioWorkspace } from "../types";

function artifactTitle(kind: IStudioArtifact["kind"]): string {
  if (kind === "asset-index") return "Ресурсы";
  if (kind === "creative") return "Креативы";
  return localizedHeading(
    kind
      .split("-")
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" "),
  );
}

function ArtifactMetadata({ artifact }: { artifact: IStudioArtifact }) {
  return (
    <div className="mt-4 grid gap-3 border-t border-[var(--workspace-brand-line)] pt-4 text-xs text-[var(--workspace-brand-muted)] md:grid-cols-3">
      <div>
        <span className="block font-semibold tracking-normal text-[var(--workspace-brand-foreground)]">
          Использует
        </span>
        {artifact.uses.length ? artifact.uses.join(", ") : "Нет"}
      </div>
      <div>
        <span className="block font-semibold tracking-normal text-[var(--workspace-brand-foreground)]">
          Используется в
        </span>
        {artifact.usedBy.length ? artifact.usedBy.join(", ") : "Нет"}
      </div>
      <div>
        <span className="block font-semibold tracking-normal text-[var(--workspace-brand-foreground)]">
          Источники
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

export function MarkdownDocument({
  children,
  hideTitle = false,
  baseUrl,
  resolveLink,
}: {
  children: string;
  hideTitle?: boolean;
  baseUrl?: string;
  resolveLink?: (url: string) => string | { href: string; target: "_top" };
}) {
  const slugify = (raw: string, fallback: (value: string) => string) => {
    const value = canonicalHeading(raw);
    return /[^\u0000-\u007f]/u.test(value)
      ? value
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, "")
          .trim()
          .replace(/\s+/g, "-") || fallback(value)
      : fallback(value);
  };
  const assetUrl = (value: string = "") => {
    if (!baseUrl || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, `https://studio.invalid${baseUrl}`);
    return url.pathname + url.search + url.hash;
  };
  return (
    <div className="min-w-0 max-w-none break-words [&>:first-child]:mt-0 [&>div>:first-child]:mt-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[var(--workspace-brand-background)] [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-[var(--workspace-brand-muted)] [&_a]:text-[var(--workspace-brand-muted)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--workspace-brand-line)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--workspace-brand-background)] [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-[var(--workspace-brand-foreground)] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--workspace-brand-foreground)] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-[var(--workspace-brand-foreground)] [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-[var(--workspace-brand-line)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--workspace-brand-line)] [&_th]:bg-[var(--workspace-brand-background)] [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
      <Markdown
        options={
          baseUrl
            ? {
                slugify,
                overrides: {
                  img: {
                    component: ({
                      src,
                      alt,
                      ...props
                    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                      <img {...props} src={assetUrl(src)} alt={alt ?? ""} />
                    ),
                  },
                  a: {
                    component: ({
                      href,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const resolved =
                        resolveLink?.(assetUrl(href)) ?? assetUrl(href);
                      return (
                        <a
                          {...props}
                          {...(typeof resolved === "string"
                            ? { href: resolved }
                            : resolved)}
                        />
                      );
                    },
                  },
                },
              }
            : { slugify }
        }
      >
        {documentReviewBody(children, hideTitle)}
      </Markdown>
    </div>
  );
}

function ArtifactContent({ artifact }: { artifact: IStudioArtifact }) {
  if (artifact.sourcePaths.some((sourcePath) => sourcePath.endsWith(".yaml"))) {
    return (
      <pre className="overflow-x-auto rounded-2xl bg-[var(--workspace-brand-primary)] p-5 text-sm leading-6 text-[var(--workspace-brand-on-primary)]">
        <code>{artifact.content}</code>
      </pre>
    );
  }
  return <MarkdownDocument hideTitle>{artifact.content}</MarkdownDocument>;
}

export function ArtifactDocument({
  workspace,
  kind,
}: {
  workspace: IStudioWorkspace;
  kind: IStudioArtifact["kind"];
}) {
  const exportRef = useRef<HTMLElement>(null);
  const artifact = workspace.artifacts.find(
    (candidate) => candidate.kind === kind,
  );
  const hasLocalContent = Boolean(artifact?.content.trim());
  if (!artifact || (workspace.id === "startup" && !hasLocalContent)) {
    const sourcePath = artifact?.sourcePaths[0];
    return (
      <main
        data-workspace-projection={workspace.id}
        className="grid min-h-screen font-[family-name:var(--workspace-brand-font-body)] place-items-center bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] md:p-10"
      >
        <section className="w-full rounded-3xl border border-dashed border-[var(--workspace-brand-line)] bg-white p-8 text-center  md:p-12">
          <p className="text-xs font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
            {workspace.label}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Документ «{artifactTitle(kind)}» не переопределён
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--workspace-brand-muted)]">
            Файл startup пока пуст. Записывайте данные клиента в указанный файл.
            Результат наследования доступен в отдельной ветке default.
          </p>
          {sourcePath ? (
            <code className="mt-6 inline-block rounded-lg bg-[var(--workspace-brand-background)] px-3 py-2 text-xs text-[var(--workspace-brand-muted)]">
              {sourcePath}
            </code>
          ) : null}
        </section>
      </main>
    );
  }
  const guidance = documentPurpose(artifact.kind, artifact.description);
  return (
    <main
      data-workspace-projection={workspace.id}
      ref={exportRef}
      className="min-h-screen font-[family-name:var(--workspace-brand-font-body)] bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] md:p-10"
    >
      <DocumentHeader
        actions={
          artifact.sourcePath.endsWith(".md") ? (
            <DocumentDownloads
              fileName={artifactTitle(artifact.kind)}
              htmlTargetRef={exportRef}
              markdown={artifact.content}
              theme="dark"
              title={artifactTitle(artifact.kind)}
            />
          ) : undefined
        }
        title={artifactTitle(artifact.kind)}
        {...guidance}
      />

      <section className="w-full rounded-3xl border border-[var(--workspace-brand-line)] bg-white px-5 py-7  md:px-10 md:py-10">
        <ArtifactContent artifact={artifact} />
        <ArtifactMetadata artifact={artifact} />
      </section>
    </main>
  );
}
