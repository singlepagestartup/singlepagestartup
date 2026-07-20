import type postgres from "postgres";
import { getPostgresClient } from "./postgres";

export interface IPostgresAdvisoryLockProps<T> {
  namespace: string;
  key: string;
  execute: () => Promise<T>;
  sql?: postgres.Sql;
}

export type PostgresAdvisoryLockRunner = <T>(
  props: IPostgresAdvisoryLockProps<T>,
) => Promise<T>;

function getLockIdentity(props: { namespace: string; key: string }) {
  const namespace = props.namespace.trim();
  const key = props.key.trim();

  if (!namespace) {
    throw new Error("Validation error. Advisory lock namespace is required.");
  }

  if (!key) {
    throw new Error("Validation error. Advisory lock key is required.");
  }

  return `${namespace}:${key}`;
}

export const withPostgresAdvisoryLock: PostgresAdvisoryLockRunner = async <T>(
  props: IPostgresAdvisoryLockProps<T>,
) => {
  const identity = getLockIdentity(props);
  const connection = await (props.sql ?? getPostgresClient()).reserve();
  let acquired = false;

  try {
    await connection`
      SELECT pg_advisory_lock(hashtextextended(${identity}, 0))
    `;
    acquired = true;

    return await props.execute();
  } finally {
    try {
      if (acquired) {
        await connection`
          SELECT pg_advisory_unlock(hashtextextended(${identity}, 0))
        `;
      }
    } finally {
      connection.release();
    }
  }
};
