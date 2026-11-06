import { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { Repository as SourceRepository } from "@sps/knowledge/models/source/backend/app/api/src/lib/repository";
import { Configuration as SourceConfiguration } from "@sps/knowledge/models/source/backend/app/api/src/lib/configuration";
import { Service as ChunkService } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/service";
import { Repository as ChunkRepository } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/repository";
import { Configuration as ChunkConfiguration } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/configuration";
import { Service as SourcesToChunksService } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/service";
import { Repository as SourcesToChunksRepository } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/repository";
import { Configuration as SourcesToChunksConfiguration } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/configuration";
import { Service as SourcesToFilesService } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Repository as SourcesToFilesRepository } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as SourcesToFilesConfiguration } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { Repository as FileStorageFileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileStorageFileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";

export interface IKnowledgeServices {
  source: SourceService;
  chunk: ChunkService;
  sourcesToChunks: SourcesToChunksService;
  sourcesToFileStorageModuleFiles: SourcesToFilesService;
  fileStorageModule: { file: FileStorageFileService };
}
export interface IKnowledgeCompositionProps
  extends Partial<IKnowledgeServices> {
  processing?: boolean;
}
function bindTransaction<T extends { repository: object }>(
  service: T,
  tx: unknown,
): T {
  const repository = Object.assign(
    Object.create(Object.getPrototypeOf(service.repository)),
    service.repository,
    { db: tx },
  );
  return Object.assign(Object.create(Object.getPrototypeOf(service)), service, {
    repository,
  });
}
export function createKnowledgeServices(
  props: IKnowledgeCompositionProps = {},
): IKnowledgeServices {
  const graph: IKnowledgeServices = {
    source:
      props.source ||
      new SourceService(new SourceRepository(new SourceConfiguration())),
    chunk:
      props.chunk ||
      new ChunkService(new ChunkRepository(new ChunkConfiguration())),
    sourcesToChunks:
      props.sourcesToChunks ||
      new SourcesToChunksService(
        new SourcesToChunksRepository(new SourcesToChunksConfiguration()),
      ),
    sourcesToFileStorageModuleFiles:
      props.sourcesToFileStorageModuleFiles ||
      new SourcesToFilesService(
        new SourcesToFilesRepository(new SourcesToFilesConfiguration()),
      ),
    fileStorageModule: props.fileStorageModule || {
      file: new FileStorageFileService(
        new FileStorageFileRepository(new FileStorageFileConfiguration()),
      ),
    },
  };
  const configure = (
    scope: IKnowledgeServices,
    inTransaction: boolean,
    queue: (() => Promise<unknown>)[],
  ) => {
    const process = async (sourceId: string, material: boolean) => {
      if (props.processing === false) return;
      try {
        if (material) {
          const { MaterialService } = await import("./service/materials");
          await new MaterialService({ source: graph.source }).rebuild(sourceId);
        }
        const { KnowledgeIndexer } = await import("./indexer");
        await new KnowledgeIndexer({ source: graph.source }).index({
          sourceId,
        });
      } catch (error) {
        console.error(
          "Knowledge Source saved; processing failed",
          sourceId,
          error,
        );
      }
    };
    scope.source.configure({
      chunk: scope.chunk,
      sourcesToChunks: scope.sourcesToChunks,
      sourcesToFileStorageModuleFiles: scope.sourcesToFileStorageModuleFiles,
      fileStorageFile: scope.fileStorageModule.file,
      inTransaction,
      afterCommit: (operation) => {
        queue.push(operation);
      },
      process,
      readSnapshot: async (operation) =>
        (graph.source.repository as SourceRepository).readSnapshot(
          async (tx) => {
            const readGraph: IKnowledgeServices = {
              source: bindTransaction(graph.source, tx),
              chunk: bindTransaction(graph.chunk, tx),
              sourcesToChunks: bindTransaction(graph.sourcesToChunks, tx),
              sourcesToFileStorageModuleFiles: bindTransaction(
                graph.sourcesToFileStorageModuleFiles,
                tx,
              ),
              fileStorageModule: {
                file: bindTransaction(graph.fileStorageModule.file, tx),
              },
            };
            configure(readGraph, true, []);
            return operation(readGraph.source);
          },
        ),
      transaction: async (operation) => {
        const afterCommit: (() => Promise<unknown>)[] = [];
        const result = await (
          graph.source.repository as SourceRepository
        ).transaction(async (tx) => {
          const transactionGraph: IKnowledgeServices = {
            source: bindTransaction(graph.source, tx),
            chunk: bindTransaction(graph.chunk, tx),
            sourcesToChunks: bindTransaction(graph.sourcesToChunks, tx),
            sourcesToFileStorageModuleFiles: bindTransaction(
              graph.sourcesToFileStorageModuleFiles,
              tx,
            ),
            fileStorageModule: {
              file: bindTransaction(graph.fileStorageModule.file, tx),
            },
          };
          configure(transactionGraph, true, afterCommit);
          return operation(transactionGraph.source);
        });
        for (const callback of afterCommit) await callback();
        return result;
      },
    });
    scope.sourcesToFileStorageModuleFiles.configure({
      inTransaction,
      fileStorageFile: scope.fileStorageModule.file,
      mutate: async (operation) =>
        (await scope.source.mutateFileRelation(operation)).relation,
    });
  };
  configure(graph, false, []);
  return graph;
}
