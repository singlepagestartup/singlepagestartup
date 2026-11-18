import { serviceBootstrap as chunkOwner } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as sourcesToChunksOwner } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as sourcesToFilesOwner } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as fileOwner } from "@sps/file-storage/models/file/backend/app/api/src/lib/bootstrap";
import {
  createChildAppAssembly,
  type IAppAssembly,
  type IRepository,
  type IServiceBootstrap,
} from "@sps/shared-backend-api";
import type { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import type { Repository as SourceRepository } from "@sps/knowledge/models/source/backend/app/api/src/lib/repository";
import type { Service as ChunkService } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/service";
import type { Service as SourcesToChunksService } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/service";
import type { Service as SourcesToFilesService } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";
import type { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";

export interface IKnowledgeServices {
  source: SourceService;
  chunk: ChunkService;
  sourcesToChunks: SourcesToChunksService;
  sourcesToFileStorageModuleFiles: SourcesToFilesService;
  fileStorageModule: { file: FileStorageFileService };
}

export function createKnowledgeAssembly(
  parent: IAppAssembly,
  sourceOwner: IServiceBootstrap<SourceService>,
  getGraph: () => IKnowledgeServices,
): IAppAssembly {
  return createChildAppAssembly(parent, ({ overrideServiceWith }) => {
    overrideServiceWith(sourceOwner, () => getGraph().source);
    overrideServiceWith(chunkOwner, () => getGraph().chunk);
    overrideServiceWith(sourcesToChunksOwner, () => getGraph().sourcesToChunks);
    overrideServiceWith(
      sourcesToFilesOwner,
      () => getGraph().sourcesToFileStorageModuleFiles,
    );
    overrideServiceWith(fileOwner, () => getGraph().fileStorageModule.file);
  });
}

interface ITransactionService<T> {
  repository: IRepository;
  withRepository(repository: IRepository, assembly: IAppAssembly): T;
}

function bindTransaction<T>(
  service: ITransactionService<T>,
  tx: unknown,
  assembly: IAppAssembly,
): T {
  const repository = Object.assign(
    Object.create(Object.getPrototypeOf(service.repository)),
    service.repository,
    { db: tx },
  );
  return service.withRepository(repository, assembly);
}

export function configureSource(
  graph: IKnowledgeServices,
  scope: IKnowledgeServices,
  processing: boolean,
  inTransaction: boolean,
  queue: (() => Promise<unknown>)[],
  sourceOwner: IServiceBootstrap<SourceService>,
  rootAssembly: IAppAssembly,
): void {
  const process = async (sourceId: string, material: boolean) => {
    if (!processing) {
      return;
    }
    try {
      if (material) {
        const { Service: MaterialService } =
          await import("../service/materials");
        await new MaterialService({ source: graph.source }).rebuild(sourceId);
      }
      const { KnowledgeIndexer } = await import("../indexer");
      await new KnowledgeIndexer({ source: graph.source }).index({ sourceId });
    } catch (error) {
      console.error(
        "Knowledge Source saved; processing failed",
        sourceId,
        error,
      );
    }
  };
  const createTransactionGraph = (
    tx: unknown,
    afterCommit: (() => Promise<unknown>)[],
  ) => {
    let transactionGraph: IKnowledgeServices;
    const assembly = createKnowledgeAssembly(
      rootAssembly,
      sourceOwner,
      () => transactionGraph,
    );
    transactionGraph = {
      source: bindTransaction(graph.source, tx, assembly),
      chunk: bindTransaction(graph.chunk, tx, assembly),
      sourcesToChunks: bindTransaction(graph.sourcesToChunks, tx, assembly),
      sourcesToFileStorageModuleFiles: bindTransaction(
        graph.sourcesToFileStorageModuleFiles,
        tx,
        assembly,
      ),
      fileStorageModule: {
        file: bindTransaction(graph.fileStorageModule.file, tx, assembly),
      },
    };
    configureSource(
      graph,
      transactionGraph,
      processing,
      true,
      afterCommit,
      sourceOwner,
      rootAssembly,
    );
    configureFiles(transactionGraph, true);
    return transactionGraph;
  };

  scope.source.configure({
    get chunk() {
      return scope.chunk;
    },
    get sourcesToChunks() {
      return scope.sourcesToChunks;
    },
    get sourcesToFileStorageModuleFiles() {
      return scope.sourcesToFileStorageModuleFiles;
    },
    get fileStorageFile() {
      return scope.fileStorageModule.file;
    },
    inTransaction,
    afterCommit(operation) {
      queue.push(operation);
    },
    process,
    readSnapshot(operation) {
      return (graph.source.repository as SourceRepository).readSnapshot(
        async (tx) => operation(createTransactionGraph(tx, []).source),
      );
    },
    async transaction(operation) {
      const afterCommit: (() => Promise<unknown>)[] = [];
      const result = await (
        graph.source.repository as SourceRepository
      ).transaction(async (tx) =>
        operation(createTransactionGraph(tx, afterCommit).source),
      );
      for (const callback of afterCommit) {
        await callback();
      }
      return result;
    },
  });
}

export function configureFiles(
  scope: IKnowledgeServices,
  inTransaction: boolean,
): void {
  scope.sourcesToFileStorageModuleFiles.configure({
    inTransaction,
    get fileStorageFile() {
      return scope.fileStorageModule.file;
    },
    async mutate(operation) {
      const mutation = await scope.source.mutateFileRelation(operation);
      return mutation.relation;
    },
  });
}

export function configureScopedKnowledgeSource(
  source: SourceService,
  assembly: IAppAssembly,
  sourceOwner: IServiceBootstrap<SourceService>,
): void {
  const graph: IKnowledgeServices = {
    source,
    get chunk() {
      return chunkOwner.createService(assembly);
    },
    get sourcesToChunks() {
      return sourcesToChunksOwner.createService(assembly);
    },
    get sourcesToFileStorageModuleFiles() {
      return sourcesToFilesOwner.createService(assembly);
    },
    fileStorageModule: {
      get file() {
        return fileOwner.createService(assembly);
      },
    },
  };
  configureSource(graph, graph, true, false, [], sourceOwner, assembly);
}
