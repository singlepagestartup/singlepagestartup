import type { IComponentProps, IProfileDocumentListProps } from "./interface";
export type { IProfileDocumentListProps } from "./interface";
import {
  Component as KnowledgeModuleSource,
  type ISourceCardProps,
} from "../../../../../../../../knowledge/source";

export function Component({
  variant = "knowledge-module-source-list-document-ai-chat",
  ...card
}: IComponentProps = {}) {
  return (
    <section
      aria-label="Знания документа"
      className="grid min-w-0 gap-4"
      data-module="social"
      data-model="profile"
      data-variant={variant}
    >
      <KnowledgeModuleSource {...card} variant="id-ai-chat" />
    </section>
  );
}
