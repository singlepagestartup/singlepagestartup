import { checkChatCover } from "./chat-cover";
import { checkTaskChatScope } from "./task-chat-scope";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Table as TaskEvent } from "@sps/crm/relations/tasks-to-stages/backend/repository/database";
import { readFile } from "node:fs/promises";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { Provider as KvProvider } from "@sps/providers-kv";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import {
  RequestCustomerWorkChat,
  RequestSubjectIdOwner,
} from "@sps/rbac/models/subject/backend/app/middlewares";
import { createService as createWorker } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { Handler as SocialActions } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/find";
import { Handler as SocialMessageCreate } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Handler as AddMember } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/profile/create";
import { Handler as RemoveMember } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/profile/delete";
import { Handler as SearchMembers } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/profile/search";
import { KV_PROVIDER, RBAC_JWT_SECRET } from "@sps/shared-utils";

it("transfers an eligible task between a manager and an agent without losing conversation scope", async () => {
  const rollback = new Error("Rollback isolated CRM test data");
  try {
    await getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const subject = createService(createAppAssembly());
        const { billing, crm, ecommerce, social } = subject.modules;
        const owner = await subject.create({ data: {} });
        const buyer = await subject.create({ data: {} });
        const outsider = await subject.create({ data: {} });
        const otherManager = await subject.create({ data: {} });
        const agent = await subject.create({ data: { variant: "agent" } });
        const ownerProfile = await social.profile.create({
          data: { title: { ru: "Менеджер магазина" } },
        });
        await subject.module.subjectsToSocialModuleProfiles.create({
          data: { subjectId: owner.id, socialModuleProfileId: ownerProfile.id },
        });
        const store = await ecommerce.store.create({ data: {} });
        const storeId = store.id;
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: owner.id,
            ecommerceModuleStoreId: storeId,
            variant: "owner",
          },
        });
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: agent.id,
            ecommerceModuleStoreId: storeId,
            variant: "crm-agent",
          },
        });
        const currency = await billing.currency.create({
          data: { slug: "crm-test-credit", title: "Test credit", symbol: "TC" },
        });
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: otherManager.id,
            ecommerceModuleStoreId: storeId,
            variant: "crm-manager",
          },
        });
        const funnel = await crm.funnel.save({
          storeId,
          operationKey: randomUUID(),
          kind: "consultation",
          name: "CRM handoff",
          definition: {
            initialStageId: "answer",
            workFunding: {
              payer: "store-owner",
              currencyId: currency.id,
              maxTaskAmount: "20",
              maxRunAmount: "2",
            },
            stages: [
              {
                id: "answer",
                name: "Answer",
                defaultAssigneeSubjectId: agent.id,
                actions: [],
              },
            ],
          },
        });
        async function open(customerId: string, title: string, legacy = false) {
          const task = await crm.task.open({
            storeId,
            funnelId: funnel.id,
            customerId,
            actorId: customerId,
            operationKey: legacy ? `store-test:${randomUUID()}` : randomUUID(),
          });
          const profile =
            customerId === owner.id
              ? ownerProfile
              : await social.profile.create({
                  data: { title: { ru: title } },
                });
          if (customerId !== owner.id) {
            await subject.module.subjectsToSocialModuleProfiles.create({
              data: {
                subjectId: customerId,
                socialModuleProfileId: profile.id,
              },
            });
          }
          const chat = await subject.chatOwnership.create(owner.id, {
            variant: "customer-work",
            title,
          });
          const thread = await social.thread.create({ data: { title } });
          await social.profilesToChats.create({
            data: { chatId: chat.id, profileId: profile.id },
          });
          if (profile.id !== ownerProfile.id) {
            await social.profilesToChats.create({
              data: { chatId: chat.id, profileId: ownerProfile.id },
            });
          }
          await social.chatsToThreads.create({
            data: { chatId: chat.id, threadId: thread.id },
          });
          await social.chatsToCrmModuleTasks.create({
            data: { chatId: chat.id, crmModuleTaskId: task.id },
          });
          const scope = {
            storeId,
            taskId: task.id,
            chatId: chat.id,
            threadId: thread.id,
          };
          const assigned = await crm.task.assign({
            ...scope,
            actorId: owner.id,
            assigneeId: agent.id,
            assigneeKind: "ai",
            expectedRevision: task.revision,
            operationKey: randomUUID(),
          });
          await subject.customerWork.ensureAssignedAgentInThread(assigned);
          return { ...scope, profileId: profile.id };
        }
        async function assign(
          scope: Awaited<ReturnType<typeof open>>,
          assigneeId: string,
        ) {
          const before = await crm.task.get(scope);
          return subject.crmWorkspace.execute(owner.id, {
            kind: "assign",
            assignment: {
              ...scope,
              assigneeId,
              expectedRevision: before.revision,
              operationKey: randomUUID(),
            },
          });
        }
        const scope = await open(buyer.id, "Имя покупателя");
        await checkChatCover(subject, {
          chatId: scope.chatId,
          ownerId: owner.id,
          buyerId: buyer.id,
          buyerProfileId: scope.profileId,
          outsiderId: outsider.id,
        });
        assert.deepEqual(
          new Set(
            (
              await subject.crmWorkspace.detail(owner.id, scope)
            ).assignmentCandidates?.map(({ id }) => id),
          ),
          new Set([agent.id, owner.id]),
        );
        await assert.rejects(assign(scope, otherManager.id));
        assert.equal(
          (await subject.crmWorkspace.detail(owner.id, scope)).task
            .customerName,
          "Имя покупателя",
        );
        assert.equal(
          (await subject.crmWorkspace.tasks(owner.id, { storeId })).items[0]
            ?.customerName,
          "Имя покупателя",
        );
        assert.equal(
          (await subject.customerWork.view(buyer.id, scope)).canRequestManager,
          true,
        );
        const handoff = {
          ...scope,
          operation: "handoff" as const,
          operationKey: randomUUID(),
        };
        const pending = await subject.customerWork.execute(buyer.id, handoff);
        assert.equal(pending.awaitingManager, true);
        assert.equal(
          (await subject.customerWork.execute(buyer.id, handoff))
            .awaitingManager,
          true,
        );
        assert.equal(
          await subject.customerWork.isAwaitingManager(
            await crm.task.get(scope),
          ),
          true,
        );
        assert.equal(
          (await subject.crmWorkspace.detail(owner.id, scope)).awaitingManager,
          true,
        );
        await subject.customerWork.execute(buyer.id, {
          ...scope,
          operation: "message",
          operationKey: randomUUID(),
          text: "Buyer before a manager",
        });
        assert.equal((await crm.task.get(scope)).assigneeId, null);
        assert.deepEqual(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
          [],
        );
        await assert.rejects(
          subject.crmWorkspace.thread(outsider.id, scope),
          /Store CRM access/,
        );
        await assign(scope, owner.id);
        assert.equal(
          (await subject.crmWorkspace.thread(owner.id, scope)).canSend,
          true,
        );
        assert.equal(
          (await subject.customerWork.view(buyer.id, scope)).awaitingManager,
          false,
        );
        const reply = await subject.crmWorkspace.send(owner.id, scope, {
          operationKey: randomUUID(),
          text: "Store staff reply",
        });
        expect(reply.metadata?.customerWorkStaffSubjectId).toBe(owner.id);
        await subject.customerWork.execute(buyer.id, {
          ...scope,
          operation: "message",
          operationKey: randomUUID(),
          text: "Buyer under a manager",
        });
        const upload = await subject.customerWork.messageFromThread({
          customerId: buyer.id,
          chatId: scope.chatId,
          threadId: scope.threadId,
          profileId: scope.profileId,
          text: "",
          hasAttachments: true,
          attachments: [
            new File(
              [
                new Uint8Array(
                  await readFile("apps/host/styles/fonts/Primary/Regular.ttf"),
                ),
              ],
              "buyer-font.ttf",
              { type: "font/ttf" },
            ),
          ],
        });
        assert.ok(upload);
        const eventForUpload = (
          await crm.tasksToStages.forMessages(undefined, [upload.id])
        )[0];
        assert.equal(eventForUpload.pending, false);
        const threadMessages = () =>
          social.threadsToMessages.find({
            params: {
              filters: {
                and: [
                  { column: "threadId", method: "eq", value: scope.threadId },
                ],
              },
            },
          });
        const beforeReturn = await threadMessages();
        assert.ok(
          beforeReturn.some(({ messageId }) => messageId === upload.id),
        );
        assert.deepEqual(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
          [],
        );
        const before = await crm.task.get(scope);
        const giveToAgent = {
          kind: "assign" as const,
          assignment: {
            storeId,
            taskId: scope.taskId,
            assigneeId: agent.id,
            expectedRevision: before.revision,
            operationKey: randomUUID(),
          },
        };
        await subject.crmWorkspace.execute(owner.id, giveToAgent);
        await subject.crmWorkspace.execute(owner.id, giveToAgent);
        const work = await subject.customerWork.listPendingWork({
          taskId: scope.taskId,
        });
        assert.equal(work.length, 1);
        assert.equal(work[0].assigneeId, agent.id);
        const context = await subject.customerWork.contextForRun(work[0]);
        assert.ok(
          context.attachments.some(
            ({ messageId, name }) =>
              messageId === upload.id && name === "buyer-font.ttf",
          ),
        );
        assert.equal(context.messages.at(-1)?.role, "user");
        assert.match(context.messages.at(-1)?.content ?? "", /buyer-font\.ttf/);
        assert.deepEqual(
          new Set((await threadMessages()).map(({ messageId }) => messageId)),
          new Set(beforeReturn.map(({ messageId }) => messageId)),
        );
        assert.equal(
          (await subject.crmWorkspace.thread(owner.id, scope)).canSend,
          true,
        );
        assert.equal(
          (await subject.customerWork.view(buyer.id, scope)).canRequestManager,
          true,
        );
        await assign(scope, owner.id);
        await assign(scope, agent.id);
        await subject.customerWork.ack(work[0]);
        const latestWork = await subject.customerWork.listPendingWork({
          taskId: scope.taskId,
        });
        assert.equal(latestWork.length, 1);
        assert.notEqual(latestWork[0].eventId, work[0].eventId);
        await assert.rejects(
          subject.customerWork.deliverReply({
            ...work[0],
            attemptId: randomUUID(),
            text: "Obsolete assignment",
          }),
        );
        const agentReply = {
          ...latestWork[0],
          attemptId: randomUUID(),
          text: "Font received.",
        };
        const firstReply = await subject.customerWork.deliverReply(agentReply);
        assert.deepEqual(
          await subject.customerWork.deliverReply(agentReply),
          firstReply,
        );
        await subject.customerWork.ack(latestWork[0]);
        await assign(scope, owner.id);
        await assign(scope, agent.id);
        assert.deepEqual(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
          [],
        );
        await assign(scope, owner.id);
        await subject.customerWork.execute(buyer.id, {
          ...scope,
          operation: "message",
          operationKey: randomUUID(),
          text: "Is the font ready?",
        });
        await subject.crmWorkspace.send(owner.id, scope, {
          operationKey: randomUUID(),
          text: "Yes, thank you.",
        });
        await assign(scope, agent.id);
        assert.deepEqual(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
          [],
        );

        const thread = await social.thread.create({
          data: { title: "Доставка", variant: "custom" },
        });
        await social.chatsToThreads.create({
          data: {
            chatId: scope.chatId,
            threadId: thread.id,
            variant: "custom",
            orderIndex: -1,
          },
        });
        const memberRouter = new Hono();
        const chatPath =
          "/subjects/:id/social-module/chats/:socialModuleChatId";
        const authenticated = new RequestSubjectIdOwner().init({
          requireJwt: true,
          activeSubjectId: (token) =>
            subject.isAuthorizedService.getSubjectId(token),
        });
        const settingsAccess = new RequestCustomerWorkChat(
          subject.customerWork,
        );
        memberRouter.get(
          chatPath + "/profiles/search",
          authenticated,
          settingsAccess.init(false, "members"),
          (c, next) => new SearchMembers(subject).execute(c, next),
        );
        memberRouter.post(
          chatPath + "/profiles",
          authenticated,
          settingsAccess.init(true, "members"),
          (c, next) => new AddMember(subject).execute(c, next),
        );
        memberRouter.delete(
          chatPath + "/profiles/:socialModuleProfileId",
          authenticated,
          settingsAccess.init(true, "members"),
          (c, next) => new RemoveMember(subject).execute(c, next),
        );
        const changeMember = async (
          actorId: string,
          profileId: string,
          remove = false,
        ) => {
          const token = await signJwt(
            { subjectId: actorId, type: "access", lifetimeInSeconds: 600 },
            RBAC_JWT_SECRET!,
          );
          const body = new FormData();
          body.set(
            "data",
            JSON.stringify({ socialModuleProfileId: profileId }),
          );
          const path =
            "/subjects/" +
            actorId +
            "/social-module/chats/" +
            scope.chatId +
            "/profiles";
          return memberRouter.request(remove ? path + "/" + profileId : path, {
            method: remove ? "DELETE" : "POST",
            headers: { Authorization: "Bearer " + token },
            body: remove ? undefined : body,
          });
        };
        const authorize = (
          actorId: string,
          operation: string | undefined,
          targetThread?: string,
        ) =>
          subject.customerWork.assertChatAccess({
            subjectId: actorId,
            chatId: scope.chatId,
            edit: true,
            threadId: targetThread,
            settingsOperation: operation,
          });
        const settings = subject.crmWorkspace.chatSettings;
        const managerSettings = await settings.presentation(
          owner.id,
          scope.chatId,
        );
        assert.equal(managerSettings.canManageChat, true);
        assert.equal(managerSettings.mainThreadId, scope.threadId);
        assert.ok(
          managerSettings.protectedProfileIds?.includes(scope.profileId),
        );
        const executor = await subject.crmWorkspace.employees.agentProfile(
          agent.id,
        );
        assert.ok(
          executor && managerSettings.protectedProfileIds.includes(executor.id),
        );
        assert.equal(
          (await settings.presentation(buyer.id, scope.chatId)).canManageChat,
          false,
        );
        await authorize(owner.id, "update-chat");
        for (const operation of [
          "update-chat",
          "members",
          "create-thread",
          "update-thread",
          "delete-thread",
          "delete-chat",
        ]) {
          await assert.rejects(
            authorize(otherManager.id, operation, thread.id),
            /owner/i,
          );
        }
        assert.equal(
          (await settings.presentation(otherManager.id, scope.chatId))
            .canManageChat,
          false,
        );
        await authorize(owner.id, "create-thread");
        await authorize(owner.id, "update-thread", thread.id);
        await authorize(owner.id, "delete-thread", thread.id);
        await assert.rejects(
          authorize(owner.id, "delete-thread", scope.threadId),
          /primary task discussion/,
        );
        await assert.rejects(authorize(owner.id, undefined), /Forbidden/);
        await assert.rejects(authorize(buyer.id, "update-chat"), /Forbidden/);
        await assert.rejects(
          authorize(outsider.id, "update-chat"),
          /Not Found/,
        );
        const eligible = await subject.create({ data: {} });
        const eligibleProfile =
          await subject.crmWorkspace.employees.ensureActorProfile(eligible.id);
        const foreignProfile =
          await subject.crmWorkspace.employees.ensureActorProfile(outsider.id);
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: eligible.id,
            ecommerceModuleStoreId: storeId,
            variant: "crm-worker",
          },
        });
        for (const id of [eligibleProfile, foreignProfile]) {
          await social.profile.update({
            id,
            data: { adminTitle: "Chat roster fixture" },
          });
        }
        const searchToken = await signJwt(
          { subjectId: owner.id, type: "access", lifetimeInSeconds: 600 },
          RBAC_JWT_SECRET!,
        );
        const search = await memberRouter.request(
          "/subjects/" +
            owner.id +
            "/social-module/chats/" +
            scope.chatId +
            "/profiles/search?q=Chat%20roster%20fixture",
          { headers: { Authorization: "Bearer " + searchToken } },
        );
        assert.equal(search.status, 200, await search.clone().text());
        expect(
          (await search.json()).data.map((item: { id: string }) => item.id),
        ).toEqual([eligibleProfile]);
        const added = await changeMember(owner.id, eligibleProfile);
        assert.equal(added.status, 200, await added.clone().text());
        assert.equal((await added.json()).data.variant, "participant");
        await assert.rejects(
          authorize(eligible.id, "update-chat"),
          /Forbidden/,
        );
        assert.equal(
          (await changeMember(owner.id, eligibleProfile)).status,
          200,
        );
        assert.ok(!(await changeMember(owner.id, foreignProfile)).ok);
        assert.ok(!(await changeMember(buyer.id, eligibleProfile)).ok);
        for (const id of managerSettings.protectedProfileIds ?? []) {
          assert.ok(!(await changeMember(owner.id, id, true)).ok);
        }
        assert.equal(
          (await changeMember(owner.id, eligibleProfile, true)).status,
          200,
        );
        await assert.rejects(subject.crmWorkspace.thread(eligible.id, scope));
        const router = new Hono();
        router.get(
          "/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/actions",
          new RequestSubjectIdOwner().init({
            requireJwt: true,
            activeSubjectId: (token) =>
              subject.isAuthorizedService.getSubjectId(token),
          }),
          new RequestCustomerWorkChat(subject.customerWork).init(
            false,
            "actions",
          ),
          (context, next) => new SocialActions(subject).execute(context, next),
        );
        router.post(
          "/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
          new RequestSubjectIdOwner().init({
            requireJwt: true,
            activeSubjectId: (token) =>
              subject.isAuthorizedService.getSubjectId(token),
          }),
          new RequestCustomerWorkChat(subject.customerWork).init(false),
          (context, next) =>
            new SocialMessageCreate(subject).execute(context, next),
        );
        const post = async (
          subjectId: string,
          profileId: string,
          threadId: string,
          sourceSystemId: string,
        ) => {
          const token = await signJwt(
            { subjectId, type: "access", lifetimeInSeconds: 600 },
            RBAC_JWT_SECRET!,
          );
          const body = new FormData();
          body.set(
            "data",
            JSON.stringify({
              description: "Сообщение менеджера в чате задачи",
              sourceSystemId,
            }),
          );
          return router.request(
            `/subjects/${subjectId}/social-module/profiles/${profileId}/chats/${scope.chatId}/threads/${threadId}/messages`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body,
            },
          );
        };
        for (const threadId of [scope.threadId, thread.id]) {
          const key = randomUUID();
          const response = await post(owner.id, ownerProfile.id, threadId, key);
          assert.equal(response.status, 200, await response.clone().text());
          const saved = (await response.json()).data;
          expect(saved.authorProfileIds).toEqual([ownerProfile.id]);
          assert.equal(
            (
              await (
                await post(owner.id, ownerProfile.id, threadId, key)
              ).json()
            ).data.id,
            saved.id,
          );
          const staffWork = await subject.customerWork.pendingForMessage({
            messageId: saved.id,
            threadId,
          });
          assert.ok(staffWork);
          const context = await subject.customerWork.contextForRun(staffWork);
          expect(context.messages.at(-1)).toEqual({
            role: "user",
            content: "[Store staff] Сообщение менеджера в чате задачи",
          });
          const answer = await subject.customerWork.deliverReply({
            ...staffWork,
            attemptId: randomUUID(),
            text: "Ответ на вопрос менеджера.",
          });
          const discussion = await subject.crmWorkspace.thread(owner.id, {
            ...scope,
            threadId,
          });
          assert.ok(
            discussion.messages.some(({ id }) => id === answer.messageId),
          );
          await subject.customerWork.ack(staffWork);
          const links = await social.threadsToMessages.find({
            params: {
              filters: {
                and: [{ column: "messageId", method: "eq", value: saved.id }],
              },
            },
          });
          expect(links.map(({ threadId }) => threadId)).toEqual([threadId]);
        }
        assert.equal((await crm.task.get(scope)).assigneeId, agent.id);
        assert.ok(
          !(await post(outsider.id, ownerProfile.id, thread.id, randomUUID()))
            .ok,
        );
        assert.ok(
          !(await post(owner.id, ownerProfile.id, randomUUID(), randomUUID()))
            .ok,
        );
        const interrupted = await post(
          owner.id,
          ownerProfile.id,
          thread.id,
          randomUUID(),
        );
        expect(interrupted.status).toBe(200);
        const interruptedWork = await subject.customerWork.pendingForMessage({
          messageId: (await interrupted.json()).data.id,
          threadId: thread.id,
        });
        assert.ok(interruptedWork);
        await assign(scope, owner.id);
        await assert.rejects(
          subject.customerWork.deliverReply({
            ...interruptedWork,
            attemptId: randomUUID(),
            text: "Запоздалый ответ",
          }),
        );
        for (const [subjectId, profileId] of [
          [buyer.id, scope.profileId],
          [owner.id, ownerProfile.id],
        ]) {
          const humanTurn = await post(
            subjectId,
            profileId,
            thread.id,
            randomUUID(),
          );
          expect(humanTurn.status).toBe(200);
          expect(
            await subject.customerWork.pendingForMessage({
              messageId: (await humanTurn.json()).data.id,
              threadId: thread.id,
            }),
          ).toBeNull();
        }
        expect(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
        ).toEqual([]);
        await assign(scope, agent.id);
        const buyerManager =
          await subject.module.subjectsToEcommerceModuleStores.create({
            data: {
              subjectId: buyer.id,
              ecommerceModuleStoreId: storeId,
              variant: "crm-manager",
            },
          });
        const asManager = await post(
          buyer.id,
          scope.profileId,
          thread.id,
          randomUUID(),
        );
        assert.equal(asManager.status, 200, await asManager.clone().text());
        const buyerWork = await subject.customerWork.pendingForMessage({
          threadId: thread.id,
          messageId: (await asManager.json()).data.id,
        });
        assert.ok(buyerWork);
        expect(
          (await subject.customerWork.contextForRun(buyerWork)).messages.at(-1),
        ).toEqual({
          role: "user",
          content: "Сообщение менеджера в чате задачи",
        });
        await subject.customerWork.ack(buyerWork);
        const buyerReply = await subject.customerWork.messageFromThread({
          customerId: buyer.id,
          profileId: scope.profileId,
          chatId: scope.chatId,
          threadId: thread.id,
          text: "Please confirm the shipping time.",
          hasAttachments: false,
          sourceSystemId: randomUUID(),
        });
        const pendingReply =
          buyerReply &&
          (await subject.customerWork.pendingForMessage({
            messageId: buyerReply.id,
            threadId: thread.id,
          }));
        assert.ok(pendingReply);
        const buyerToken = await signJwt(
          { subjectId: buyer.id, type: "access", lifetimeInSeconds: 600 },
          RBAC_JWT_SECRET!,
        );
        async function replyActions(threadId: string, messageId: string) {
          const response = await router.request(
            `/subjects/${buyer.id}/social-module/profiles/${scope.profileId}/chats/${scope.chatId}/actions?socialModuleThreadId=${threadId}`,
            { headers: { Authorization: `Bearer ${buyerToken}` } },
          );
          expect(response.status).toBe(200);
          const { data } = await response.json();
          return data.filter(
            (action: {
              payload: { phase: string; triggerMessageId: string };
            }) =>
              action.payload.phase === "reply_generation" &&
              action.payload.triggerMessageId === messageId,
          );
        }
        expect(await replyActions(thread.id, buyerReply.id)).toMatchObject([
          { payload: { status: "running" } },
        ]);
        expect(await replyActions(scope.threadId, buyerReply.id)).toEqual([]);
        await assert.rejects(
          authorize(owner.id, "delete-thread", thread.id),
          /reply is pending/,
        );
        await subject.module.subjectsToEcommerceModuleStores.delete({
          id: buyerManager.id,
        });
        const threadContext =
          await subject.customerWork.contextForRun(pendingReply);
        assert.match(
          threadContext.messages.at(-1)?.content ?? "",
          /Please confirm the shipping time/,
        );
        const response = await subject.customerWork.deliverReply({
          ...pendingReply,
          attemptId: randomUUID(),
          text: "Delivery on Monday.",
        });
        const placement = await social.threadsToMessages.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: response.messageId,
                },
              ],
            },
          },
        });
        expect(placement.map(({ threadId }) => threadId)).toEqual([thread.id]);
        const discussion = { ...scope, threadId: thread.id };
        const read = await subject.crmWorkspace.thread(owner.id, discussion);
        assert.equal(read.title, "Доставка");
        assert.ok(read.messages.some(({ id }) => id === response.messageId));
        await assert.rejects(
          subject.crmWorkspace.thread(outsider.id, discussion),
        );
        await subject.customerWork.ack(pendingReply);
        expect(await replyActions(thread.id, buyerReply.id)).toEqual([]);
        const question = {
          customerId: buyer.id,
          profileId: scope.profileId,
          chatId: scope.chatId,
          threadId: thread.id,
          text: "Please try this question",
          hasAttachments: false,
        };
        const unanswered = await subject.customerWork.messageFromThread({
          ...question,
          sourceSystemId: randomUUID(),
        });
        assert.ok(unanswered);
        const [waiting] = await replyActions(thread.id, unanswered.id);
        expect(waiting.payload.status).toBe("running");
        const queued = await subject.customerWork.pendingForMessage({
          messageId: unanswered.id,
          threadId: thread.id,
        });
        assert.ok(queued);
        for (let attempt = 0; attempt < 4; attempt++) {
          // A fresh worker each time, with the real persistent queue and no provider call.
          const worker = createWorker(createAppAssembly());
          const generate = jest
            .spyOn(worker, "dispatch")
            .mockRejectedValue(new Error("Temporary preparation failure"));
          await worker.drain(1, scope.taskId);
          expect(generate).toHaveBeenCalledTimes(1);
          if (attempt < 3) {
            expect(
              await subject.customerWork.listPendingWork({
                taskId: scope.taskId,
              }),
            ).toEqual([]);
            expect(
              (await replyActions(thread.id, unanswered.id))[0],
            ).toMatchObject({ id: waiting.id, payload: { status: "running" } });
            // Advance only this fixture's retry deadline inside the rollback transaction.
            await tx
              .update(TaskEvent)
              .set({ queuedAt: new Date(0) })
              .where(eq(TaskEvent.id, queued.eventId));
          }
        }
        expect(await replyActions(thread.id, unanswered.id)).toMatchObject([
          { id: waiting.id, payload: { status: "failed" } },
        ]);
        expect(await replyActions(scope.threadId, unanswered.id)).toEqual([]);
        expect(
          await subject.customerWork.listPendingWork({ taskId: scope.taskId }),
        ).toEqual([]);
        const resent = await subject.customerWork.messageFromThread({
          ...question,
          sourceSystemId: randomUUID(),
        });
        assert.ok(resent);
        const [newAction] = await replyActions(thread.id, resent.id);
        expect(newAction.id).not.toBe(waiting.id);
        expect(newAction.payload.status).toBe("running");
        const pendingResend = await subject.customerWork.pendingForMessage({
          messageId: resent.id,
          threadId: thread.id,
        });
        assert.ok(pendingResend);
        await subject.customerWork.deliverReply({
          ...pendingResend,
          attemptId: randomUUID(),
          text: "Delivery confirmed.",
        });
        await subject.customerWork.ack(pendingResend);
        expect(await replyActions(thread.id, resent.id)).toEqual([]);
        expect(await replyActions(thread.id, unanswered.id)).toMatchObject([
          { id: waiting.id, payload: { status: "failed" } },
        ]);
        const legacy = await open(owner.id, "Legacy shared account", true);
        assert.equal(
          (await settings.presentation(owner.id, legacy.chatId)).canManageChat,
          true,
        );
        await subject.customerWork.assertChatAccess({
          subjectId: owner.id,
          chatId: legacy.chatId,
          edit: true,
          settingsOperation: "update-chat",
        });
        for (const foreign of [
          { ...scope, threadId: legacy.threadId },
          { ...scope, chatId: legacy.chatId, threadId: legacy.threadId },
        ]) {
          await assert.rejects(
            subject.crmWorkspace.thread(owner.id, foreign),
            /task conversation is unavailable/,
          );
        }
        await assign(legacy, owner.id);
        await subject.crmWorkspace.send(owner.id, legacy, {
          operationKey: randomUUID(),
          text: "Staff from same account",
        });
        const legacyMessages = (
          await subject.customerWork.view(owner.id, legacy)
        ).messages;
        assert.equal(
          legacyMessages.find(({ body }) => body === "Staff from same account")
            ?.kind,
          "operator",
        );
        await assign(legacy, agent.id);
        assert.deepEqual(
          await subject.customerWork.listPendingWork({ taskId: legacy.taskId }),
          [],
        );
        assert.equal(
          (await subject.crmWorkspace.thread(owner.id, legacy)).canSend,
          true,
        );
        await crm.task.close({
          storeId,
          taskId: scope.taskId,
          actorId: owner.id,
          expectedRevision: (await crm.task.get(scope)).revision,
          operationKey: randomUUID(),
          reason: "Customer conversation completed",
        });
        const closed = await subject.crmWorkspace.detail(owner.id, scope);
        assert.equal(closed.task.status, "closed");
        assert.deepEqual(
          new Set(closed.assignmentCandidates?.map(({ id }) => id)),
          new Set([agent.id, owner.id]),
        );
        await assert.rejects(assign(scope, owner.id), /task is closed/i);
        await checkTaskChatScope(subject, {
          storeId,
          funnelId: funnel.id,
          ownerId: owner.id,
          ownerProfileId: ownerProfile.id,
          buyerId: buyer.id,
          buyerProfileId: scope.profileId,
          otherProfileId: foreignProfile,
          otherSubjectId: outsider.id,
        });
        throw rollback;
      }),
    );
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  } finally {
    await getPostgresClient().end();
    resetPostgresClient();
    const kv = new KvProvider({ type: KV_PROVIDER }).client;
    if (kv.client && "disconnect" in kv.client) {
      kv.client.disconnect();
    }
  }
});
