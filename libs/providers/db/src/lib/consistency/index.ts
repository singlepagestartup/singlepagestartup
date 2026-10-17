import { getPostgresClient } from "@sps/shared-backend-database-config";
import { createHash, randomUUID } from "node:crypto";
import {
  CONSISTENCY_LEASE_MS,
  type IConsistencyMetadata,
  type IConsistencyEvent,
} from "@sps/shared-utils";

export interface IRegisteredConsistencyQuery {
  ref: string;
  auth: string;
  dependencies: Record<string, string>;
  expires_at: Date;
}

/** Durable consistency storage; callers never supply SQL identifiers. */
export class ConsistencyStore {
  readonly sql = getPostgresClient();

  async status() {
    const [row] = await this.sql`SELECT
      (SELECT value FROM sps_consistency.state WHERE id='epoch') AS epoch,
      coalesce((SELECT max(sequence)::text FROM sps_consistency.delivery),'0') AS cursor,
      coalesce((SELECT min(sequence)::text FROM sps_consistency.delivery),'0') AS oldest,
      coalesce((SELECT extract(epoch FROM (now()-min(created_at)))*1000 FROM sps_consistency.outbox WHERE NOT processed),0) AS lag`;
    if (!row?.epoch) throw new Error("Consistency migrations are required");
    return {
      epoch: String(row.epoch),
      cursor: String(row.cursor),
      oldest: String(row.oldest),
      lagMs: Number(row.lag),
      degraded: Number(row.lag) > 2000,
    };
  }

  async versions(
    keys: string[],
    connection = this.sql,
  ): Promise<Record<string, string>> {
    if (!keys.length) return {};
    const rows =
      await connection`SELECT key,version::text AS version FROM sps_consistency.generation WHERE key = ANY(${connection.array(keys)}::text[])`;
    return Object.fromEntries(
      keys.map((key) => [
        key,
        String(rows.find((row) => row.key === key)?.version || "0"),
      ]),
    );
  }

  async resources() {
    return this
      .sql`SELECT resource,topic,columns FROM sps_consistency.resource`;
  }

  async readDependencies(ref: string) {
    const [row] = await this
      .sql`SELECT dependencies,collections FROM sps_consistency.query WHERE ref=${ref} AND expires_at>now()`;
    return row as
      | {
          dependencies: Record<string, string>;
          collections: Record<string, string>;
        }
      | undefined;
  }

  async covered(resource: string) {
    const [row] = await this
      .sql`SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='sps_consistency_rows' AND tgrelid=to_regclass(${resource}) AND tgenabled IN ('O','A')) AS covered`;
    return Boolean(row?.covered);
  }

  async assertCoverage() {
    const missing = await this
      .sql`SELECT resource FROM sps_consistency.resource r WHERE NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=to_regclass(r.resource) AND t.tgname='sps_consistency_rows' AND t.tgenabled IN ('O','A')) OR NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=to_regclass(r.resource) AND t.tgname='sps_consistency_truncate' AND t.tgenabled IN ('O','A'))`;
    if (missing.length)
      throw new Error(
        `Consistency migrations required for ${missing.map((row) => row.resource).join(", ")}`,
      );
  }

  async register(props: {
    auth: string;
    identity: string;
    dependencies: Record<string, string>;
    tags?: string[];
    collections?: Record<string, string>;
  }): Promise<IConsistencyMetadata> {
    const status = await this.status();
    const candidate = randomUUID() + randomUUID().replaceAll("-", "");
    const expires = new Date(Date.now() + CONSISTENCY_LEASE_MS);
    const sorted = (values: Record<string, string>) =>
      Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify([
          status.epoch,
          props.auth,
          props.identity,
          sorted(props.dependencies),
          sorted(props.collections || {}),
          [...(props.tags || [])].sort(),
        ]),
      )
      .digest("hex");
    const [registration] = await this
      .sql`INSERT INTO sps_consistency.query(ref,fingerprint,auth,identity,dependencies,collections,tags,expires_at)
        VALUES(${candidate},${fingerprint},${props.auth},${props.identity},${JSON.stringify(props.dependencies)}::jsonb,${JSON.stringify(props.collections || {})}::jsonb,${JSON.stringify(props.tags || [])}::jsonb,${expires.toISOString()})
        ON CONFLICT(fingerprint) DO UPDATE SET expires_at=greatest(sps_consistency.query.expires_at,excluded.expires_at),retain_until=greatest(sps_consistency.query.retain_until,excluded.retain_until)
        RETURNING ref,expires_at`;
    return {
      protocol: 1,
      epoch: status.epoch,
      ref: String(registration.ref),
      expiresAt: new Date(registration.expires_at).toISOString(),
      cursor: status.cursor,
    };
  }

  async queries(
    refs: string[],
    auth: string,
  ): Promise<IRegisteredConsistencyQuery[]> {
    if (refs.length > 100)
      throw new Error("Too many consistency subscriptions");
    if (!refs.length) return [];
    return (await this
      .sql`SELECT ref,auth,dependencies,expires_at FROM sps_consistency.query WHERE ref=ANY(${this.sql.array(refs)}::text[]) AND auth=${auth} AND expires_at>now()`) as unknown as IRegisteredConsistencyQuery[];
  }

  async changed(refs: string[], auth: string) {
    const queries = await this.queries(refs, auth);
    const keys = [
      ...new Set(queries.flatMap((q) => Object.keys(q.dependencies))),
    ];
    const versions = await this.versions(keys);
    return refs.filter((ref) => {
      const q = queries.find((q) => q.ref === ref);
      return (
        !q ||
        Object.entries(q.dependencies).some(([key, v]) => versions[key] !== v)
      );
    });
  }

  async renew(refs: string[], auth: string) {
    const changed = await this.changed(refs, auth);
    const unchanged = refs.filter((ref) => !changed.includes(ref));
    const expiresAt = new Date(Date.now() + CONSISTENCY_LEASE_MS);
    if (unchanged.length)
      await this
        .sql`UPDATE sps_consistency.query SET expires_at=${expiresAt.toISOString()}, retain_until=greatest(retain_until,${expiresAt.toISOString()}::timestamptz+interval '2 minutes') WHERE ref=ANY(${this.sql.array(unchanged)}::text[]) AND auth=${auth} AND expires_at>now()`;
    return {
      refs: changed,
      renewedRefs: unchanged,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async events(after: string, limit = 128): Promise<IConsistencyEvent[]> {
    if (!/^\d+$/.test(after)) throw new Error("Invalid consistency cursor");
    const rows = await this
      .sql`SELECT sequence::text,event_id AS "eventId",keys,versions FROM sps_consistency.delivery WHERE sequence>${after}::bigint ORDER BY sequence LIMIT ${Math.min(128, limit)}`;
    return rows as unknown as IConsistencyEvent[];
  }

  async dispatch(
    invalidateTags: (
      tags: string[],
      keys: string[],
    ) => Promise<void> = async () => {},
  ) {
    return this.sql.begin(async (tx) => {
      const [lock] =
        await tx`SELECT pg_try_advisory_xact_lock(1936740195) AS locked`;
      if (!lock.locked) return 0;
      const pending =
        await tx`SELECT id,operation_id,keys FROM sps_consistency.outbox WHERE NOT processed ORDER BY created_at,id LIMIT 128 FOR UPDATE SKIP LOCKED`;
      if (!pending.length) return 0;
      const keys = [...new Set(pending.flatMap((row) => row.keys as string[]))];
      const queryRows =
        await tx`SELECT tags FROM sps_consistency.query WHERE retain_until>now() AND dependencies ?| ${tx.array(keys)}::text[]`;
      const tags = [
        ...new Set(queryRows.flatMap((row) => row.tags as string[])),
      ];
      await invalidateTags(tags, keys);
      // Sequence allocation and commit are serialized by the transaction lock.
      // An outbox UUID/creation time is deliberately never used as a cursor.
      const versions = await this.versions(keys, tx as typeof this.sql);
      const operations = new Map<string, { id: string; keys: Set<string> }>();
      for (const row of pending) {
        let group = operations.get(row.operation_id);
        if (!group) {
          group = { id: row.id, keys: new Set() };
          operations.set(row.operation_id, group);
        }
        (row.keys as string[]).forEach((key) => group!.keys.add(key));
      }
      for (const group of operations.values()) {
        const eventKeys = [...group.keys];
        const eventVersions = Object.fromEntries(
          eventKeys.map((key) => [key, versions[key]]),
        );
        await tx`INSERT INTO sps_consistency.delivery(event_id,keys,versions) VALUES(${group.id},${JSON.stringify(eventKeys)}::jsonb,${JSON.stringify(eventVersions)}::jsonb) ON CONFLICT(event_id) DO NOTHING`;
      }
      await tx`UPDATE sps_consistency.outbox SET processed=true WHERE id=ANY(${tx.array(pending.map((row) => row.id))}::text[])`;
      await tx`SELECT pg_notify('sps_consistency_delivery','changed')`;
      return pending.length;
    });
  }

  async cleanup() {
    await this.sql`DELETE FROM sps_consistency.query WHERE retain_until<now()`;
    await this
      .sql`DELETE FROM sps_consistency.outbox WHERE processed AND created_at<now()-interval '7 days'`;
    await this
      .sql`DELETE FROM sps_consistency.delivery WHERE created_at<now()-interval '7 days'`;
  }

  async diagnostics() {
    const [counts] = await this.sql`SELECT
      (SELECT count(*)::int FROM sps_consistency.outbox WHERE NOT processed) AS pending,
      (SELECT count(*)::int FROM sps_consistency.query WHERE expires_at>now()) AS active_refs,
      (SELECT count(*)::int FROM sps_consistency.query) AS retained_refs,
      (SELECT count(*)::int FROM sps_consistency.delivery) AS deliveries,
      (SELECT count(*)::int FROM sps_consistency.generation) AS generations`;
    return { ...(await this.status()), ...counts };
  }

  /** Call after restoring capture and before reopening traffic after maintenance. */
  async reset(invalidateTags: (tags: string[]) => Promise<void>) {
    await this.assertCoverage();
    return this.sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(1936740195)`;
      const rows =
        await tx`SELECT tags FROM sps_consistency.query WHERE retain_until>now()`;
      await invalidateTags([
        ...new Set(rows.flatMap((row) => row.tags as string[])),
      ]);
      const epoch = randomUUID();
      const resetKeys =
        await tx`INSERT INTO sps_consistency.generation(key,version)
        SELECT resource||'|reset',1 FROM sps_consistency.resource
        ON CONFLICT(key) DO UPDATE SET version=sps_consistency.generation.version+1 RETURNING key`;
      await tx`INSERT INTO sps_consistency.outbox(id,operation_id,keys) VALUES(${randomUUID()},${"reset:" + epoch},${JSON.stringify(resetKeys.map((row) => row.key))}::jsonb)`;
      await tx`UPDATE sps_consistency.state SET value=${epoch} WHERE id='epoch'`;
      await tx`DELETE FROM sps_consistency.query`;
      await tx`SELECT pg_notify('sps_consistency_delivery','reset')`;
      return epoch;
    });
  }
}
