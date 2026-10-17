/** Source templates shared by catalog generation and its contract fixtures. */
export const effectivePropsContract = `import type { ComponentProps } from "react";
import type { variants } from "./variants";

export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & Omit<
    NonNullable<ComponentProps<(typeof variants)[Variant]>>,
    "variant"
  >;
}[keyof typeof variants];
`;

export const modelComponent = `import type { ComponentType } from "react";
import type { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  const ChildComponent = variants[props.variant] as ComponentType<IComponentProps>;
  if (!ChildComponent) return <></>;
  return <ChildComponent {...props} />;
}
`;

export function projectionInterface(
  variant: "admin-v2-table" | "admin-v2-card" | "list",
) {
  const record =
    variant === "admin-v2-table"
      ? ""
      : 'import type { IRecord } from "../admin-v2-table/interface";\n';
  const inputs =
    variant === "admin-v2-table"
      ? "  empty?: boolean;"
      : variant === "admin-v2-card"
        ? "  id?: string;\n  data?: IRecord;\n  className?: string;"
        : "  data?: IRecord[];\n  count?: number;\n  empty?: boolean;\n  className?: string;";
  return `${record}\nexport const variant = ${JSON.stringify(variant)};\nexport interface IComponentProps {\n  variant?: typeof variant;\n${inputs}\n}\nexport interface IComponentPropsExtended extends IComponentProps {}\n`;
}

export const skeletonPropsContract = `export interface ISkeletonProps {
  variant?: IComponentProps["variant"];
  className?: string;
  rows?: number;
}
`;

export function modelSkeleton(module: string, model: string) {
  return `import type { ISkeletonProps } from "./interface";
export function Skeleton({ variant, className = "", rows = 3 }: ISkeletonProps) {
  const table = /(?:table|list)/.test(variant ?? "");
  const form = /(?:form|create|update|settings|authentication|checkout)/.test(variant ?? "");
  const image = /(?:avatar|image|cover|asset|preview)/.test(variant ?? "");
  const conversation = ${module === "social" && ["thread", "chat"].includes(model)} && /ai-chat/.test(variant ?? "") && !table && !form;
  const project = ${module === "social" && model === "profile"} && /ai-chat-project/.test(variant ?? "") && !table && !form;
  const document = ${module === "knowledge" && model === "source"} && !table && !form;
  const media = ${module === "file-storage" && model === "file"} && !table && !form;
  const count = Number.isFinite(rows) ? Math.min(12, Math.max(1, Math.floor(rows))) : 3;
  const layout = project ? "project" : conversation ? "conversation" : document ? "document" : image || media ? "image" : table ? "list" : form ? "form" : "card";
  return <section role="status" aria-busy="true" aria-label=${JSON.stringify("Loading " + model.replaceAll("-", " "))} data-module=${JSON.stringify(module)} data-model=${JSON.stringify(model)} data-variant={variant} data-skeleton-layout={layout} className={"min-w-0 w-full space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6 " + className}>
    <span className="sr-only">${"Loading " + model.replaceAll("-", " ") + "…"}</span>
    <div aria-hidden="true" className="space-y-4">
      <div className="h-5 w-2/5 rounded bg-muted motion-safe:animate-pulse" />
      {project ? <div className="grid min-h-96 gap-5 lg:grid-cols-[210px_minmax(0,1fr)]"><aside className="hidden space-y-5 rounded-lg bg-muted p-4 lg:block">{Array.from({ length: count }, (_, index) => <div key={index} className="h-4 rounded bg-border motion-safe:animate-pulse" />)}</aside><div className="flex min-w-0 flex-col justify-between gap-8"><div className="h-6 w-1/2 rounded bg-muted motion-safe:animate-pulse" /><div className="h-52 rounded-xl bg-muted motion-safe:animate-pulse" /><div className="h-28 rounded-xl border border-border bg-muted motion-safe:animate-pulse" /></div></div> : conversation ? <div className="flex min-h-96 flex-col justify-between gap-8"><div className="space-y-8">{Array.from({ length: count }, (_, index) => <div key={index} className="flex gap-3"><div className="size-8 shrink-0 rounded-lg bg-muted motion-safe:animate-pulse" /><div className="w-full space-y-3"><div className="h-3 w-1/4 rounded bg-muted motion-safe:animate-pulse" /><div className="h-14 w-4/5 rounded-xl bg-muted motion-safe:animate-pulse" /></div></div>)}</div><div className="h-28 rounded-xl border border-border bg-muted motion-safe:animate-pulse" /></div> : document ? <div className="space-y-4"><div className="h-40 w-full rounded-xl border border-border bg-muted motion-safe:animate-pulse" /><div className="flex gap-3"><div className="h-16 w-1/3 rounded-lg bg-muted motion-safe:animate-pulse" /><div className="h-16 w-1/3 rounded-lg bg-muted motion-safe:animate-pulse" /></div></div> : image || media ? <div className="aspect-square w-full max-w-xs rounded-xl bg-muted motion-safe:animate-pulse" /> : <div className={table ? "divide-y divide-border" : "grid gap-4 sm:grid-cols-2"}>
        {Array.from({ length: count }, (_, index) => <div key={index} className={table ? "flex items-center gap-4 py-3" : "space-y-3 rounded-lg border border-border p-4"}>
          <div className={"shrink-0 rounded-lg bg-muted motion-safe:animate-pulse " + (table ? "size-10" : "h-4 w-1/3")} />
          <div className="w-full space-y-2"><div className="h-3 w-4/5 rounded bg-muted motion-safe:animate-pulse" /><div className="h-3 w-3/5 rounded bg-muted motion-safe:animate-pulse" /></div>
          {form && <div className="h-10 w-full rounded-lg bg-muted motion-safe:animate-pulse" />}
        </div>)}
      </div>}
    </div>
  </section>;
}
`;
}

export function skeletonStory(module: string, model: string) {
  const title = (value: string) =>
    value
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join("-");
  const moduleTitle =
    module === "rbac" ? "RBAC" : module === "crm" ? "CRM" : title(module);
  const specialized =
    module === "knowledge" && model === "source"
      ? ["DocumentLoading", "id-ai-chat"]
      : module === "social" && model === "profile"
        ? ["ProjectLoading", "scope-ai-chat-project"]
        : module === "social" && ["chat", "thread"].includes(model)
          ? ["ConversationLoading", "id-ai-chat"]
          : module === "file-storage" && model === "file"
            ? ["PreviewLoading", "id-ai-chat"]
            : module === "rbac" && model === "widget"
              ? [
                  "WorkspaceLoading",
                  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
                ]
              : undefined;
  return `import type { Meta, StoryObj } from "@storybook/react-vite";\nimport { Skeleton as Component } from "./index";\nconst meta = { id: ${JSON.stringify(`modules-${module}-models-${model}-singlepage-loading`)}, title: ${JSON.stringify(`Modules/${moduleTitle}/${title(model)}/Singlepage/Loading`)}, component: Component, parameters: { layout: "padded" } } satisfies Meta<typeof Component>;\nexport default meta;\nexport const Loading: StoryObj<typeof meta> = {};\n${specialized ? `export const ${specialized[0]}: StoryObj<typeof meta> = { args: { variant: ${JSON.stringify(specialized[1])} } };\n` : ""}`;
}
