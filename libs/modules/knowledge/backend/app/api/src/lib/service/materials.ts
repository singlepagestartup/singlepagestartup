import { KnowledgeRepository } from "../repository";
import { MediaService } from "./media";
import { assembleContent, readUserContext } from "./utils";

export interface MaterialServiceProps {
  repository: KnowledgeRepository;
  media?: MediaService;
}

export class MaterialService {
  private media: MediaService;
  constructor(private props: MaterialServiceProps) {
    this.media = props.media || new MediaService();
  }

  async rebuild(sourceId: string) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const source = await this.props.repository.findSourceById(sourceId);
      if (!source) return;
      const userContext = readUserContext(source.content);
      const reset = await this.props.repository.invalidateFileContent(
        sourceId,
        userContext,
        source.contentHash,
      );
      if (!reset) continue;
      const files = await this.props.repository.sourceFiles(sourceId);
      const snapshot = this.fileSnapshot(files);
      const parts: string[] = [];
      for (const { file } of files) {
        try {
          parts.push(
            `### ${file.adminTitle || file.alt || "Материал"}\n${await this.media.analyze(file, userContext)}`,
          );
        } catch (error) {
          throw new Error(
            `Knowledge file analysis failed for ${file.adminTitle || file.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      const materials = parts.join("\n\n");
      const overview = materials
        ? await this.media.synthesize(materials, userContext)
        : "";
      const saved = await this.props.repository.saveAnalyzedContent({
        sourceId,
        expectedContentHash: reset.contentHash,
        fileSnapshot: snapshot,
        content: assembleContent(userContext, materials, overview),
      });
      if (!saved) continue;
      return saved;
    }
    throw new Error(
      "Knowledge material changed repeatedly during analysis. Retry with the current files and context.",
    );
  }

  private fileSnapshot(
    files: Awaited<ReturnType<KnowledgeRepository["sourceFiles"]>>,
  ) {
    return JSON.stringify(
      files.map(({ relation, file }) => [
        relation.id,
        relation.fileStorageModuleFileId,
        relation.orderIndex,
        file.updatedAt,
      ]),
    );
  }
}
