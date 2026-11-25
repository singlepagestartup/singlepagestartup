import { serviceBootstrap as sourceOwner } from "@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap";
import { defaultAppAssembly, type IAppAssembly } from "@sps/shared-backend-api";
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

import {
  configureFiles,
  configureSource,
  createKnowledgeAssembly,
  type IKnowledgeServices,
} from "./source";

export type { IKnowledgeServices } from "./source";

export interface IKnowledgeCompositionProps extends Partial<IKnowledgeServices> {
  assembly?: IAppAssembly;
  processing?: boolean;
}

export function createKnowledgeServices(
  props: IKnowledgeCompositionProps = {},
): IKnowledgeServices {
  let graph: IKnowledgeServices;
  const assembly = createKnowledgeAssembly(
    props.assembly ?? defaultAppAssembly,
    sourceOwner,
    () => graph,
  );
  graph = {
    source: (
      props.source ??
      new SourceService(new SourceRepository(new SourceConfiguration()))
    ).withAppAssembly(assembly),
    chunk: (
      props.chunk ??
      new ChunkService(new ChunkRepository(new ChunkConfiguration()))
    ).withAppAssembly(assembly),
    sourcesToChunks: (
      props.sourcesToChunks ??
      new SourcesToChunksService(
        new SourcesToChunksRepository(new SourcesToChunksConfiguration()),
      )
    ).withAppAssembly(assembly),
    sourcesToFileStorageModuleFiles: (
      props.sourcesToFileStorageModuleFiles ??
      new SourcesToFilesService(
        new SourcesToFilesRepository(new SourcesToFilesConfiguration()),
      )
    ).withAppAssembly(assembly),
    fileStorageFile: (
      props.fileStorageFile ??
      new FileStorageFileService(
        new FileStorageFileRepository(new FileStorageFileConfiguration()),
      )
    ).withAppAssembly(assembly),
  };
  configureSource(
    graph,
    graph,
    props.processing !== false,
    false,
    sourceOwner,
    assembly,
  );
  configureFiles(graph, false);
  return graph;
}
