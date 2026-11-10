import { randomUUID } from "node:crypto";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as Links } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/repository";
import { Configuration as LinksConfiguration } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/configuration";
import { Repository as Channels } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository";
import { Configuration as ChannelsConfiguration } from "@sps/broadcast/models/channel/backend/app/api/src/lib/configuration";
import { Configuration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Repository } from "@sps/broadcast/models/message/backend/app/api/src/lib/repository";
import { DeliveryRepository } from "../../../repository/delivery";
import { DeliveryQueue } from ".";
import { Service } from "@sps/broadcast/models/message/backend/app/api/src/lib/service";

describe("Broadcast competing consumers", () => {
  const sql = getPostgresClient();
  const service = new Service(new Repository(new Configuration()));
  const deliveryRepository = new DeliveryRepository(new Configuration());
  const queue = new DeliveryQueue(deliveryRepository);
  const channelId = randomUUID();
  beforeAll(async () => {
    await sql`insert into sps_bt_channel(id,slug,title,admin_title) values(${channelId},${channelId},${channelId},${channelId})`;
  });
  afterAll(async () => {
    try {
      await new Channels(new ChannelsConfiguration()).deleteFirstByField(
        "id",
        channelId,
      );
    } finally {
      await sql.end();
    }
  });

  it("publishes once, hands work to one consumer, and rejects an obsolete receipt", async () => {
    const message = {
      channelId,
      key: "process",
      payload: randomUUID(),
      announce: true,
    };
    const publications = await Promise.all(
      Array.from({ length: 8 }, () => queue.publish(message)),
    );
    expect(publications.filter(Boolean)).toHaveLength(1);
    expect(await queue.publish({ ...message, payload: "duplicate" })).toBe(
      false,
    );
    const payloads =
      await sql`select id from sps_bt_message where payload=${message.payload}`;
    expect(payloads).toHaveLength(1);
    const linked =
      await sql`select m.id from sps_bt_message m join sps_bt_cs_to_ms_34z l on l.me_id=m.id where l.cl_id=${channelId}`;
    expect(linked).toHaveLength(1);
    const links = new Links(new LinksConfiguration());
    const [feed] = await links.findByField("messageId", linked[0].id);
    expect(feed).toBeDefined();
    expect(feed).not.toHaveProperty("receipt");
    const projection = await links.findWithMessage(feed.id);
    expect(projection?.message.payload).toBe(message.payload);
    expect(projection?.relation).not.toHaveProperty("receipt");
    expect(projection?.relation).not.toHaveProperty("deliveryKey");
    expect(await links.deleteFirstByField("id", feed.id)).toBeUndefined();
    const props = { channelId, concurrency: 1, leaseSeconds: 60 };
    const claimed = (
      await Promise.all(Array.from({ length: 8 }, () => queue.reserve(props)))
    ).flat();
    expect(claimed).toHaveLength(1);
    const [first] = claimed;
    expect(first.payload).toBe(message.payload);
    expect(await queue.start(first)).toBe(true);
    expect(await queue.start(first)).toBe(false);
    expect(await queue.renew(first, 60)).toBe(true);
    expect(await queue.reserve(props)).toHaveLength(0);
    await sql`update sps_bt_cs_to_ms_34z set lease_until=clock_timestamp()-interval '1 second' where me_id=${first.id}`;
    const [retry] = await queue.reserve(props);
    expect(retry.id).toBe(first.id);
    expect(retry.receipt).not.toBe(first.receipt);
    expect(await queue.acknowledge(first, "stale")).toBe(false);
    expect(await queue.release(first)).toBe(false);
    expect(await queue.start(retry)).toBe(true);
    expect(await queue.acknowledge(retry, "completed")).toBe(true);
    expect(await queue.reserve(props)).toEqual([]);
    const saved = await deliveryRepository.findFirstByField("id", first.id);
    expect(await service.findById({ id: first.id })).toBeFalsy();
    expect(saved?.payload).toBe("completed");
    expect((await links.findWithMessage(feed.id))?.message.payload).toBe(
      "completed",
    );
    await sql`update sps_bt_cs_to_ms_34z set feed_visible=false where id=${feed.id}`;
    expect(await links.findWithMessage(feed.id)).toBeNull();
    expect(
      await deliveryRepository.findFirstByField("id", first.id),
    ).toBeFalsy();
    expect(saved).not.toHaveProperty("receipt");
    await expect(service.delete({ id: first.id })).rejects.toThrow();
    expect(
      await queue.removeCompleted(channelId, new Date(Date.now() + 10_000), 1),
    ).toBe(1);
  });

  it("isolates identical keys across channels and hides unannounced work from CRUD", async () => {
    const channels = new Channels(new ChannelsConfiguration());
    const links = new Links(new LinksConfiguration());
    const other = randomUUID();
    await sql`insert into sps_bt_channel(id,slug,title,admin_title) values(${other},${other},${other},${other})`;
    try {
      for (const id of [channelId, other]) {
        expect(
          await queue.publish({ channelId: id, key: "private", payload: id }),
        ).toBe(true);
      }
      const [owner] = await queue.reserve({
        channelId: other,
        concurrency: 1,
        leaseSeconds: 60,
      });
      expect(owner.payload).toBe(other);
      expect(await queue.start({ ...owner, channelId })).toBe(false);
      expect(await links.findByField("messageId", owner.id)).toEqual([]);
      expect(
        await links.count({
          params: {
            filters: {
              and: [{ column: "messageId", method: "eq", value: owner.id }],
            },
          },
        }),
      ).toBe(0);
      expect(await service.findById({ id: owner.id })).toBeFalsy();
      const [privateLink] =
        await sql`select id from sps_bt_cs_to_ms_34z where me_id=${owner.id}`;
      expect(await links.findWithMessage(privateLink.id)).toBeNull();
      expect(await queue.start(owner)).toBe(true);
      expect(await queue.release(owner)).toBe(true);
      const [retry] = await queue.reserve({
        channelId: other,
        concurrency: 1,
        leaseSeconds: 60,
      });
      expect(retry.id).toBe(owner.id);
      expect(retry.receipt).not.toBe(owner.receipt);
      await channels.deleteFirstByField("id", other);
      expect(
        await sql`select id from sps_bt_message where id=${owner.id}`,
      ).toHaveLength(0);
      expect(await queue.states(channelId, ["private"])).toHaveLength(1);
    } finally {
      await channels.deleteFirstByField("id", other);
    }
  });
});
