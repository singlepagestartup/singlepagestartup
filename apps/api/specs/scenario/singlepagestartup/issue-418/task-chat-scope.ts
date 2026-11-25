import assert from "node:assert/strict";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import {
  RequestCustomerWorkChat,
  RequestSubjectIdOwner,
} from "@sps/rbac/models/subject/backend/app/middlewares";
import type { Service } from "@sps/rbac/models/subject/backend/app/api/src/lib/service";
import { Handler as Detail } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id";
import { Handler as Threads } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/find";
import { Handler as Messages } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find";
import { Handler as Cover } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/cover";
import { Handler as Knowledge } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find";

interface IScope {
  storeId: string;
  funnelId: string;
  ownerId: string;
  ownerProfileId: string;
  buyerId: string;
  buyerProfileId: string;
  otherProfileId: string;
  otherSubjectId: string;
}

export async function checkTaskChatScope(subject: Service, scope: IScope) {
  const { social, crm } = subject.modules;
  const chat = await subject.chatOwnership.create(scope.buyerId, {
    title: "Personal channel",
    description: "Private description",
  });
  const privateThread = await social.thread.create({
    data: { title: "Private discussion" },
  });
  const workThread = await social.thread.create({
    data: { title: "Order discussion" },
  });
  for (const [thread, variant] of [
    [privateThread, "default"],
    [workThread, "custom"],
  ] as const) {
    await social.chatsToThreads.create({
      data: { chatId: chat.id, threadId: thread.id, variant },
    });
  }
  for (const profileId of [scope.buyerProfileId, scope.otherProfileId]) {
    await social.profilesToChats.create({
      data: { profileId, chatId: chat.id },
    });
  }
  const auth = new RequestSubjectIdOwner().init({
    requireJwt: true,
    activeSubjectId: (token) => subject.isAuthorizedService.getSubjectId(token),
  });
  const access = new RequestCustomerWorkChat(subject.customerWork);
  const app = new Hono();
  const path = "/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId";
  app.get(path, auth, access.init(false, "detail"), (c, next) =>
    new Detail(subject).execute(c, next),
  );
  app.get(
    "/:id/chats/:socialModuleChatId/threads",
    auth,
    access.init(false, "threads"),
    (c, next) => new Threads(subject).execute(c, next),
  );
  app.get(path + "/cover", auth, access.init(false), (c, next) =>
    new Cover(subject).execute(c, next),
  );
  app.get(
    path + "/profiles/:targetSocialModuleProfileId/knowledge/sources",
    auth,
    access.init(false),
    (c, next) => new Knowledge(subject).execute(c, next),
  );
  for (const suffix of [
    "/threads/:socialModuleThreadId/messages",
    "/messages",
  ]) {
    app.get(path + suffix, auth, access.init(false), (c, next) =>
      new Messages(subject).execute(c, next),
    );
  }
  async function client(id: string, profileId: string) {
    const token = await signJwt(
      { subjectId: id, type: "access", lifetimeInSeconds: 600 },
      RBAC_JWT_SECRET!,
    );
    const headers = { Authorization: "Bearer " + token };
    const base = "/" + id + "/profiles/" + profileId + "/chats/" + chat.id;
    return {
      get: (suffix: string) => app.request(base + suffix, { headers }),
      threads: (query = "") =>
        app.request("/" + id + "/chats/" + chat.id + "/threads" + query, {
          headers,
        }),
    };
  }
  const staff = await client(scope.ownerId, scope.ownerProfileId);
  const buyer = await client(scope.buyerId, scope.buyerProfileId);
  const member = await client(scope.otherSubjectId, scope.otherProfileId);
  const ordinaryOwner = await buyer.get("");
  const ordinaryMember = await member.get("");
  assert.equal(ordinaryOwner.status, 200);
  assert.equal(ordinaryMember.status, 200);
  const rights = async (res: Response) =>
    ((await res.json()) as { data: { canManageChat: boolean } }).data
      .canManageChat;
  assert.equal(await rights(ordinaryOwner), true);
  assert.equal(await rights(ordinaryMember), false);
  const ordinary = { chatId: chat.id, edit: true };
  for (const op of [
    "update-chat",
    "create-thread",
    "update-thread",
    "delete-thread",
    "members",
    "delete-chat",
  ]) {
    await assert.rejects(
      subject.customerWork.assertChatAccess({
        ...ordinary,
        subjectId: scope.otherSubjectId,
        settingsOperation: op,
      }),
      /chat owner/,
    );
    await subject.customerWork.assertChatAccess({
      ...ordinary,
      subjectId: scope.buyerId,
      settingsOperation: op,
    });
  }
  const task = await crm.task.open({
    storeId: scope.storeId,
    funnelId: scope.funnelId,
    actorId: scope.buyerId,
    customerId: scope.buyerId,
    operationKey: "channel-intake:" + workThread.id,
  });
  await social.chatsToCrmModuleTasks.create({
    data: { chatId: chat.id, crmModuleTaskId: task.id },
  });
  const taskScope = {
    storeId: scope.storeId,
    taskId: task.id,
    chatId: chat.id,
    threadId: workThread.id,
  };
  // Follow the same join, detail, thread list and message requests as TaskConversation.
  const joined = await subject.crmWorkspace.execute(scope.ownerId, {
    kind: "join-task-chat",
    task: { storeId: scope.storeId, taskId: task.id },
  });
  assert.equal(joined.kind, "join-task-chat");
  assert.equal(joined.data.threadId, workThread.id);
  const response = await staff.get("?includeParticipants=true");
  assert.equal(response.status, 200, await response.clone().text());
  const { data } = (await response.json()) as {
    data: {
      title: string;
      description: string | null;
      taskChatThreadId: string;
      coverFileId: string | null;
      canManageChat: boolean;
      participants: { id: string }[];
    };
  };
  assert.equal(data.title, workThread.title);
  assert.equal(data.description, null);
  assert.equal(data.coverFileId, null);
  assert.equal(data.canManageChat, false);
  assert.equal(data.taskChatThreadId, workThread.id);
  assert.deepEqual(
    new Set(data.participants.map(({ id }) => id)),
    new Set([scope.buyerProfileId, scope.ownerProfileId]),
  );
  async function threadIds(response: Response) {
    assert.equal(response.status, 200, await response.clone().text());
    const { data } = (await response.json()) as { data: { id: string }[] };
    return new Set(data.map(({ id }) => id));
  }
  assert.deepEqual(
    await threadIds(await staff.threads()),
    new Set([workThread.id]),
  );
  assert.equal(
    (await staff.get("/threads/" + workThread.id + "/messages")).status,
    200,
  );
  for (const restricted of [
    "/threads/" + privateThread.id + "/messages",
    "/messages",
    "/cover",
    "/profiles/" + scope.otherProfileId + "/knowledge/sources",
  ]) {
    assert.equal((await staff.get(restricted)).status, 404, restricted);
  }
  assert.equal(
    (await staff.threads("?threadId=" + privateThread.id)).status,
    404,
  );
  const workspace = await subject.crmWorkspace.thread(scope.ownerId, taskScope);
  assert.ok(
    workspace.participants.every(({ id }) => id !== scope.otherProfileId),
  );
  await assert.rejects(
    subject.crmWorkspace.thread(scope.ownerId, {
      ...taskScope,
      threadId: privateThread.id,
    }),
  );
  const personal = await buyer.get("?includeParticipants=true");
  assert.equal(personal.status, 200);
  const privateChat = (await personal.json()) as {
    data: { title: string; canManageChat: boolean };
  };
  assert.equal(privateChat.data.title, chat.title);
  assert.equal(privateChat.data.canManageChat, true);
  await assert.rejects(
    subject.customerWork.assertChatAccess({
      ...ordinary,
      subjectId: scope.buyerId,
      threadId: workThread.id,
      settingsOperation: "delete-thread",
    }),
    /primary/,
  );
  assert.deepEqual(
    await threadIds(await buyer.threads()),
    new Set([privateThread.id, workThread.id]),
  );
}
