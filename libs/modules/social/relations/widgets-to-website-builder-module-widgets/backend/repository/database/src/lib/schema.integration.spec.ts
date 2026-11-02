/**
 * Given an isolated PostgreSQL schema and the generated Widget presentation migration,
 * when links are inserted or either referenced record is deleted,
 * the database enforces both references, unique pairs and independent ordered links.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("enforces Widget presentation references, pair uniqueness and cascading deletion", async () => {
  const schema = `widget_links_${randomUUID().replaceAll("-", "")}`;
  await getPostgresClient().begin(async (tx) => {
    await tx.unsafe(`CREATE SCHEMA "${schema}"`);
    await tx.unsafe(`SET LOCAL search_path TO "${schema}", public`);
    await tx.unsafe('CREATE TABLE "sl_widget" (id uuid PRIMARY KEY)');
    await tx.unsafe('CREATE TABLE "sps_w_b_widgets" (id uuid PRIMARY KEY)');
    const folder = path.resolve(
      process.cwd(),
      "libs/modules/social/relations/widgets-to-website-builder-module-widgets/backend/repository/database/src/lib/migrations",
    );
    for (const file of readdirSync(folder)
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      const sql = readFileSync(path.join(folder, file), "utf8").replaceAll(
        '"public".',
        `"${schema}".`,
      );
      for (const statement of sql
        .split("--> statement-breakpoint")
        .map((value) => value.trim())
        .filter(Boolean)) {
        await tx.unsafe(statement);
      }
    }
    const [owner, ownerB, target, targetB, missing] = Array.from(
      { length: 5 },
      () => randomUUID(),
    );
    await tx.unsafe('INSERT INTO "sl_widget" (id) VALUES ($1),($2)', [
      owner,
      ownerB,
    ]);
    await tx.unsafe('INSERT INTO "sps_w_b_widgets" (id) VALUES ($1),($2)', [
      target,
      targetB,
    ]);
    const insert =
      'INSERT INTO "sl_ws_to_we_br_me_ws_c76" (wt_id,we_br_me_wt_id,order_index) VALUES ($1,$2,$3)';
    await tx.unsafe(insert, [owner, target, 2]);
    await tx.unsafe(insert, [ownerB, target, 0]);
    await expect(
      tx.savepoint((scope) => scope.unsafe(insert, [missing, targetB, 0])),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      tx.savepoint((scope) => scope.unsafe(insert, [owner, missing, 0])),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      tx.savepoint((scope) => scope.unsafe(insert, [owner, target, 1])),
    ).rejects.toMatchObject({ code: "23505" });
    await tx.unsafe(insert, [owner, targetB, 1]);
    const links = await tx.unsafe(
      'SELECT * FROM "sl_ws_to_we_br_me_ws_c76" WHERE wt_id=$1 ORDER BY order_index',
      [owner],
    );
    expect(links.map((link) => link.we_br_me_wt_id)).toEqual([targetB, target]);
    expect(links.map((link) => link.variant)).toEqual(["default", "default"]);
    await tx.unsafe('DELETE FROM "sps_w_b_widgets" WHERE id=$1', [target]);
    expect(
      await tx.unsafe('SELECT * FROM "sl_ws_to_we_br_me_ws_c76"'),
    ).toHaveLength(1);
    await tx.unsafe('DELETE FROM "sl_widget" WHERE id=$1', [owner]);
    expect(
      await tx.unsafe('SELECT * FROM "sl_ws_to_we_br_me_ws_c76"'),
    ).toHaveLength(0);
    expect(await tx.unsafe('SELECT * FROM "sps_w_b_widgets"')).toHaveLength(1);
    await tx.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
  });
});
