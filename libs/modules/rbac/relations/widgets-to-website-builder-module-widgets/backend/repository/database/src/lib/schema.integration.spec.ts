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
it.each([
  [
    "widgets-to-website-builder-module-widgets",
    "sps_w_b_widgets",
    "we_br_me_wt_id",
    "rc_ws_to_we_br_me_ws_em4",
  ],
  [
    "widgets-to-crm-module-widgets",
    "sps_cm_widget",
    "cm_me_wt_id",
    "rc_ws_to_cm_me_ws_l65",
  ],
])(
  "applies generated %s migrations with real FK/cascade and unique pairs in an isolated schema",
  async (relation, targetTable, targetColumn, relationTable) => {
    const schema = `widget_links_${randomUUID().replaceAll("-", "")}`;
    await getPostgresClient().begin(async (tx) => {
      await tx.unsafe(`CREATE SCHEMA "${schema}"`);
      await tx.unsafe(`SET LOCAL search_path TO "${schema}", public`);
      await tx.unsafe(`CREATE TABLE "sps_rc_widget" (id uuid PRIMARY KEY)`);
      await tx.unsafe(`CREATE TABLE "${targetTable}" (id uuid PRIMARY KEY)`);
      const folder = path.resolve(
        process.cwd(),
        `libs/modules/rbac/relations/${relation}/backend/repository/database/src/lib/migrations`,
      );
      for (const file of readdirSync(folder)
        .filter((name) => name.endsWith(".sql"))
        .sort()) {
        const source = readFileSync(path.join(folder, file), "utf8").replaceAll(
          '"public".',
          `"${schema}".`,
        );
        for (const statement of source
          .split("--> statement-breakpoint")
          .map((value) => value.trim())
          .filter(Boolean))
          await tx.unsafe(statement);
      }
      const [owner, ownerB, target, targetB, missing] = Array.from(
        { length: 5 },
        () => randomUUID(),
      );
      await tx.unsafe('INSERT INTO "sps_rc_widget" (id) VALUES ($1),($2)', [
        owner,
        ownerB,
      ]);
      await tx.unsafe(`INSERT INTO "${targetTable}" (id) VALUES ($1),($2)`, [
        target,
        targetB,
      ]);
      const insert = `INSERT INTO "${relationTable}" (wt_id,"${targetColumn}",variant) VALUES ($1,$2,$3)`;
      await tx.unsafe(insert, [owner, target, "ai-chat-content"]);
      await tx.unsafe(insert, [ownerB, target, "ai-chat-content"]);
      await expect(
        tx.savepoint((scope) =>
          scope.unsafe(insert, [missing, targetB, "default"]),
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.savepoint((scope) =>
          scope.unsafe(insert, [owner, target, "ai-chat-content"]),
        ),
      ).rejects.toMatchObject({ code: "23505" });
      if (relation === "widgets-to-website-builder-module-widgets")
        await expect(
          tx.savepoint((scope) =>
            scope.unsafe(insert, [owner, targetB, "ai-chat-content"]),
          ),
        ).rejects.toMatchObject({ code: "23505" });
      await tx.unsafe(`DELETE FROM "${targetTable}" WHERE id=$1`, [target]);
      expect(await tx.unsafe(`SELECT * FROM "${relationTable}"`)).toHaveLength(
        0,
      );
      await tx.unsafe(insert, [owner, targetB, "default"]);
      await tx.unsafe('DELETE FROM "sps_rc_widget" WHERE id=$1', [owner]);
      expect(await tx.unsafe(`SELECT * FROM "${relationTable}"`)).toHaveLength(
        0,
      );
      expect(await tx.unsafe(`SELECT * FROM "${targetTable}"`)).toHaveLength(1);
      await tx.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
    });
  },
);
