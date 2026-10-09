import type {
  IAIChatFile,
  ISourceAttachmentView,
  ISourceFileRelation,
} from "./ai-chat-models";
import type { IProjectAsset, IProjectFile } from "./ai-chat-workspace";

// Mirrors Knowledge content markers; Studio has no dependency on the production helper.
const USER_BLOCK =
  /^## Контекст пользователя\n<!-- knowledge:user -->\n([\s\S]*?)\n<!-- \/knowledge:user -->/;

export function sourceUserContext(content: string): string {
  return content.match(USER_BLOCK)?.[1] ?? content;
}
export function sourceMaterials(content: string): string {
  const block = content.match(USER_BLOCK);
  return block ? content.slice(block[0].length).trim() : "";
}
export function editSourceUserContext(
  content: string,
  context: string,
): string {
  const block = content.match(USER_BLOCK);
  return block
    ? `## Контекст пользователя\n<!-- knowledge:user -->\n${context}\n<!-- /knowledge:user -->${content.slice(block[0].length)}`
    : context;
}

export function sourceAttachmentAssets(
  title: string,
  relations: ISourceFileRelation[],
  files: IAIChatFile[],
  presentation: ISourceAttachmentView[],
): IProjectAsset[] {
  const records = new Map(files.map((file) => [file.id, file]));
  const views = new Map(presentation.map((view) => [view.relationId, view]));
  const viewFile = (file: IAIChatFile): IProjectFile => ({
    id: file.id,
    name: file.alt || file.adminTitle || file.file.split("/").pop() || "File",
    text: "",
    fileUrl: file.file || undefined,
    mimeType: file.mimeType ?? undefined,
    size: file.size ?? 0,
  });
  return [...relations]
    .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id))
    .flatMap((relation) => {
      const file = records.get(relation.fileStorageModuleFileId);
      if (!file) return [];
      const view = views.get(relation.id);
      return [
        {
          id: view?.id ?? relation.id,
          section: title,
          file: viewFile(file),
        },
      ];
    });
}
