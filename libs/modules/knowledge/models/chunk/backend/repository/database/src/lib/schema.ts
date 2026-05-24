import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_ke";
export const table = "chunk";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => {
    return {
      embeddingHnswIdx: pgCore
        .index("sps_ke_chunk_embedding_hnsw_idx")
        .using("hnsw", table.embedding.op("vector_cosine_ops")),
    };
  },
);
