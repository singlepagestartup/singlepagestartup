/**
 * BDD Suite: the wallet login challenge is single use against a real database.
 *
 * Given: an rc_action row written as an EVM nonce, with an expiry and no consumed mark.
 * When: the conditional claim the verifier issues runs against Postgres.
 * Then: a fresh nonce is claimed once, a second claim finds nothing, an expired nonce is refused, and concurrent claims leave exactly one winner.
 */

import { randomUUID } from "node:crypto";
import { Container } from "inversify";
import {
  Configuration,
  DI,
  type IConfiguration,
  type IRepository,
  DatabaseRepository,
} from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/action/backend/repository/database";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { EVM_NONCE_ACTION_TYPE } from "./utils";

function createRepository(): IRepository {
  const container = new Container();

  container.bind<IConfiguration>(DI.IConfiguration).toConstantValue(
    new Configuration({
      repository: {
        type: "database",
        Table,
        insertSchema,
        selectSchema,
        dump: { active: false, type: "json", directory: "" },
        seed: {
          active: false,
          module: "rbac",
          name: "action",
          type: "model",
        },
      },
    }),
  );
  container
    .bind<IRepository>(DI.IRepository)
    .to(DatabaseRepository as any)
    .inSingletonScope();

  return container.get<IRepository>(DI.IRepository);
}

/** The predicate the verifier sends with every claim. */
function claimable() {
  return {
    and: [
      {
        column: "payload->>type",
        method: "eq" as const,
        value: EVM_NONCE_ACTION_TYPE,
      },
      { column: "consumedAt", method: "isNull" as const, value: undefined },
      {
        column: "expiresAt",
        method: "gt" as const,
        value: new Date().toISOString(),
      },
    ],
  };
}

describe("Given: a wallet login challenge row in Postgres", () => {
  const repository = createRepository();
  const written: string[] = [];

  async function issue(props?: { expiresAt?: Date }) {
    const row = await repository.insert({
      id: randomUUID(),
      expiresAt: props?.expiresAt || new Date(Date.now() + 120 * 1000),
      payload: {
        type: EVM_NONCE_ACTION_TYPE,
        evm: {
          purpose: "authentication",
          address: "0x0000000000000000000000000000000000000001",
          chainId: 1,
          consumedAt: null,
        },
      },
    });

    written.push(row.id);

    return row;
  }

  function claim(id: string) {
    return repository.consumeFirstByField(
      "id",
      id,
      { consumedAt: new Date() },
      claimable(),
    );
  }

  afterAll(async () => {
    for (const id of written) {
      await repository.deleteFirstByField("id", id).catch(() => undefined);
    }

    await getPostgresClient().end();
    resetPostgresClient();
  });

  /**
   * BDD Scenario: the ordinary redemption.
   *
   * Given: a fresh challenge.
   * When: it is claimed.
   * Then: the row comes back with its payload, so the purpose and address the
   * challenge was bound to are read from the claim itself.
   */
  it("claims a fresh challenge once", async () => {
    const row = await issue();

    const claimed = await claim(row.id);

    expect(claimed?.id).toBe(row.id);
    expect(claimed?.consumedAt).toBeInstanceOf(Date);
    expect(claimed?.payload?.evm?.purpose).toBe("authentication");
  });

  /**
   * BDD Scenario: the replay.
   *
   * Given: a challenge that was already claimed.
   * When: it is claimed again.
   * Then: nothing comes back.
   */
  it("refuses the same challenge a second time", async () => {
    const row = await issue();

    await claim(row.id);
    const second = await claim(row.id);

    expect(second).toBeUndefined();
  });

  /**
   * BDD Scenario: the expiry travels with the write.
   *
   * Given: a challenge whose expiry has passed.
   * When: it is claimed.
   * Then: nothing comes back, without a separate read of the row.
   */
  it("refuses an expired challenge", async () => {
    const row = await issue({ expiresAt: new Date(Date.now() - 1000) });

    expect(await claim(row.id)).toBeUndefined();
  });

  /**
   * BDD Scenario: another kind of action row.
   *
   * Given: an action row that is not an EVM nonce.
   * When: the wallet claim names it.
   * Then: nothing comes back and the row is left unconsumed, so one flow
   * cannot burn another flow's rows.
   */
  it("refuses an action row of another type and leaves it unconsumed", async () => {
    const row = await repository.insert({
      id: randomUUID(),
      expiresAt: new Date(Date.now() + 120 * 1000),
      payload: { type: "oauth-state", oauth: { consumedAt: null } },
    });
    written.push(row.id);

    expect(await claim(row.id)).toBeUndefined();
    expect((await repository.findFirstByField("id", row.id))?.consumedAt).toBe(
      null,
    );
  });

  /**
   * BDD Scenario: the property the conditional write exists for.
   *
   * Given: one challenge and several requests redeeming it at the same time.
   * When: all of them run concurrently.
   * Then: exactly one is answered with the row and every other gets nothing.
   */
  it("leaves exactly one winner when redemptions race", async () => {
    const row = await issue();

    const results = await Promise.all(
      Array.from({ length: 10 }, () => claim(row.id)),
    );

    expect(results.filter((result) => result?.id === row.id)).toHaveLength(1);
    expect(results.filter((result) => !result)).toHaveLength(9);
  });
});
