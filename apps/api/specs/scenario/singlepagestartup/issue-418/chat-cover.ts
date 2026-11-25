import assert from "node:assert/strict";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import {
  RequestSubjectIdOwner,
  RequestCustomerWorkChat,
} from "@sps/rbac/models/subject/backend/app/middlewares";
import type { Service } from "@sps/rbac/models/subject/backend/app/api/src/lib/service";
import { Handler as Cover } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/cover";
import { Handler as Update } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/update";

interface IScope {
  chatId: string;
  ownerId: string;
  buyerId: string;
  buyerProfileId: string;
  outsiderId: string;
}

export async function checkChatCover(subject: Service, scope: IScope) {
  const router = new Hono();
  const auth = new RequestSubjectIdOwner().init({
    requireJwt: true,
    activeSubjectId: (token) => subject.isAuthorizedService.getSubjectId(token),
  });
  const access = new RequestCustomerWorkChat(subject.customerWork);
  router.patch(
    "/:id/chats/:socialModuleChatId",
    auth,
    access.init(true, "update-chat"),
    (c, next) => new Update(subject).execute(c, next),
  );
  router.get(
    "/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/cover",
    auth,
    access.init(false),
    (c, next) => new Cover(subject).execute(c, next),
  );

  async function request(id: string, profileId?: string, body?: FormData) {
    const token = await signJwt(
      { subjectId: id, type: "access", lifetimeInSeconds: 600 },
      RBAC_JWT_SECRET!,
    );
    const chat = "/chats/" + scope.chatId;
    return router.request(
      "/" +
        id +
        (profileId ? "/profiles/" + profileId + chat + "/cover" : chat),
      {
        headers: { Authorization: "Bearer " + token },
        method: body ? "PATCH" : "GET",
        body,
      },
    );
  }
  async function getCoverId(response: Response) {
    return ((await response.json()) as { data: { coverFileId: string | null } })
      .data.coverFileId;
  }
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXWQAAAAASUVORK5CYII=",
    "base64",
  );
  function upload(bytes: Buffer) {
    const data = new FormData();
    data.append("data", "{}");
    data.append(
      "coverFile",
      new File([Uint8Array.from(bytes)], "cover.png", { type: "image/png" }),
    );
    return data;
  }
  const read = () => request(scope.buyerId, scope.buyerProfileId);
  assert.equal((await read()).status, 404);
  assert.equal(
    (await request(scope.buyerId, undefined, upload(png))).status,
    403,
  );
  const save = await request(scope.ownerId, undefined, upload(png));
  assert.equal(save.status, 200, await save.clone().text());
  const first = await getCoverId(save);
  assert.ok(first);
  const content = await read();
  assert.equal(content.status, 200);
  assert.equal(content.headers.get("content-type"), "image/png");
  assert.equal(content.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Buffer.from(await content.arrayBuffer()), png);
  const metadata = new FormData();
  const title = { ru: "Чат заказа", en: "Order chat" };
  const description = {
    ru: "<p>Детали заказа</p>",
    en: "<p>Order details</p>",
  };
  metadata.set("data", JSON.stringify({ title, description }));
  const updated = await request(scope.ownerId, undefined, metadata);
  assert.equal(updated.status, 200);
  assert.equal(await getCoverId(updated), first);
  const saved = await subject.modules.social.chat.findById({
    id: scope.chatId,
  });
  assert.deepEqual(JSON.parse(saved!.title!), title);
  assert.deepEqual(JSON.parse(saved!.description!), description);
  const outside = await request(scope.outsiderId, scope.buyerProfileId);
  assert.ok(
    [401, 403, 404].includes(outside.status),
    `Unexpected outsider response ${outside.status}`,
  );
  assert.notEqual(outside.headers.get("content-type"), "image/png");
  const invalid = await request(
    scope.ownerId,
    undefined,
    upload(Buffer.from("invalid data")),
  );
  assert.equal(invalid.status, 400);
  assert.equal(await subject.socialChatSettings.coverId(scope.chatId), first);
  const replacement = await request(scope.ownerId, undefined, upload(png));
  assert.equal(replacement.status, 200);
  const second = await getCoverId(replacement);
  assert.ok(second);
  assert.notEqual(second, first);
  assert.equal(
    await subject.modules.fileStorage.file.privateContent.findById({
      id: first,
    }),
    null,
  );
  const data = new FormData();
  data.append("data", JSON.stringify({ removeCover: true }));
  const removed = await request(scope.ownerId, undefined, data);
  assert.equal(removed.status, 200);
  assert.equal(await getCoverId(removed), null);
  assert.equal((await read()).status, 404);
  assert.equal(
    await subject.modules.fileStorage.file.privateContent.findById({
      id: second,
    }),
    null,
  );
}
