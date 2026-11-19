import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { ProviderSecretStore } from "./secret-store";
import type { SubjectServiceDependencies } from "../index";
import {
  connectionCommand,
  providerTerms,
  providerType,
  providerCapability,
  type IConnectionCommand,
  type IProviderCapability,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";

export class ProviderConnections {
  constructor(
    private readonly subject: SubjectServiceDependencies<
      "repository" | "create" | "findById" | "workLedger"
    >,
    private readonly vault = new ProviderSecretStore(),
  ) {}

  private async assertOwner(actorId: string, storeId: string) {
    const owners =
      await this.subject.module.subjectsToEcommerceModuleStores.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleStoreId",
                method: "eq",
                value: storeId,
              },
              { column: "subjectId", method: "eq", value: actorId },
              { column: "variant", method: "eq", value: "owner" },
            ],
          },
          limit: 1,
        },
      });
    if (!owners.length) {
      throw new Error("Permission error. Store ownership required");
    }
  }

  async chatModels(customerId: string, profileId: string, chatId: string) {
    const criteria = (column: string, value: string) => ({
      params: { filters: { and: [{ column, method: "eq" as const, value }] } },
    });
    const social = this.subject.modules.social;
    const [owned, member] = await Promise.all([
      this.subject.module.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: customerId },
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: profileId,
              },
            ],
          },
          limit: 1,
        },
      }),
      social.profilesToChats.find({
        params: {
          filters: {
            and: [
              { column: "profileId", method: "eq", value: profileId },
              { column: "chatId", method: "eq", value: chatId },
            ],
          },
          limit: 1,
        },
      }),
    ]);
    if (!owned.length || !member.length)
      throw new Error("Forbidden error. Profile is outside this chat");
    const threads = await social.chatsToThreads.find(
      criteria("chatId", chatId),
    );
    const models = new Map<
      string,
      {
        id: string;
        name: string;
        description: string;
        contextLength: number;
        inputModalities: string[];
        outputModalities: string[];
        supportedParameters: string[];
        supportsReasoning: boolean;
        reasoning: null;
      }
    >();
    for (const thread of threads) {
      const [link] = await social.threadsToCrmModuleTasks.find(
        criteria("threadId", thread.threadId),
      );
      if (!link) continue;
      const task = await this.subject.modules.crm.task.findById({
        id: link.crmModuleTaskId,
      });
      if (
        !task ||
        task.customerId !== customerId ||
        task.status === "closed" ||
        task.assigneeKind !== "ai" ||
        !task.assigneeId
      )
        continue;
      const [personal, defaults] = await Promise.all([
        this.assignments(task.storeId, task.assigneeId),
        this.assignments(task.storeId, null),
      ]);
      const bindings = [
        ...personal,
        ...defaults.filter(
          (row) =>
            !personal.some(
              (specific) => specific.capability === row.capability,
            ),
        ),
      ];
      for (const binding of bindings) {
        const capability = providerCapability.safeParse(binding.capability);
        if (!capability.success) continue;
        const [connection] =
          await this.subject.module.subjectsToProviderIdentities.find({
            params: {
              filters: {
                and: [
                  { column: "storeId", method: "eq", value: task.storeId },
                  {
                    column: "identityId",
                    method: "eq",
                    value: binding.identityId,
                  },
                  {
                    column: "subjectId",
                    method: "eq",
                    value: binding.executorId,
                  },
                  { column: "active", method: "eq", value: true },
                ],
              },
              limit: 1,
            },
          });
        if (!connection) continue;
        const kind = capability.data === "image" ? "image" : "text";
        models.set(binding.model + ":" + kind, {
          id: binding.model,
          name: binding.model,
          description: connection.label,
          contextLength: providerTerms.parse(binding.terms).maxInputTokens,
          inputModalities: ["text"],
          outputModalities: [kind],
          supportedParameters: [],
          supportsReasoning: false,
          reasoning: null,
        });
      }
    }
    const groups = ["text", "image"].map((kind) => ({
      id: kind,
      title: kind === "text" ? "Text" : "Image",
      models: [...models.values()].filter((model) =>
        model.outputModalities.includes(kind),
      ),
    }));
    return {
      auto: {
        id: "auto",
        name: "Auto",
        description: "Use the provider assigned to this task.",
      },
      groups: groups.filter((group) => group.models.length),
    };
  }

  async list(actorId: string, storeId: string, before?: string) {
    await this.assertOwner(actorId, storeId);
    const filters = {
      and: [{ column: "storeId", method: "eq" as const, value: storeId }],
    };
    const [connections, assignments] = await Promise.all([
      this.subject.module.subjectsToProviderIdentities.find({
        params: { filters },
      }),
      this.subject.module.subjectsToProviderAgents.find({
        params: { filters },
      }),
    ]);
    const visible = await Promise.all(
      connections.map(
        async ({
          id,
          identityId,
          subjectId,
          label,
          externalAccount,
          version,
          active,
        }) => {
          const identity = await this.subject.module.identity.findById({
            id: identityId,
          });
          return {
            id,
            identityId,
            subjectId,
            label,
            externalAccount,
            version,
            active,
            provider: providerType.parse(identity?.provider),
          };
        },
      ),
    );
    const { items: operations, nextCursor } =
      await this.subject.module.subjectsToWalletOperations.history(
        storeId,
        before,
      );
    const links =
      await this.subject.module.subjectsToEcommerceModuleStores.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleStoreId",
                method: "eq",
                value: storeId,
              },
              { column: "variant", method: "eq", value: "assistant" },
            ],
          },
          limit: 100,
        },
      });
    const assistants = await Promise.all(
      links.map(async (link) => {
        const assistant = await this.subject.findById({ id: link.subjectId });
        return { id: link.subjectId, label: assistant?.slug ?? link.subjectId };
      }),
    );
    return {
      connections: visible,
      assignments,
      operations,
      assistants,
      nextCursor,
    };
  }

  async change(actorId: string, input: IConnectionCommand) {
    const command = connectionCommand.parse(input);
    return this.subject.repository.withWalletLocks(
      [`provider-store:${command.storeId}`],
      async () => {
        const result = await this.apply(actorId, command);
        if (!result) throw new Error("Not found. Provider connection");
        // Persist only the fact and participants. Never copy the request into Actions.
        const action = await this.subject.module.action.create({
          data: {
            variant: "provider-connection",
            payload: {
              operation: command.operation,
              storeId: command.storeId,
              actorId,
              recordId: result.id,
              connectionId:
                "connectionId" in command ? command.connectionId : result.id,
            },
          },
        });
        await this.subject.module.subjectsToActions.create({
          data: { subjectId: actorId, actionId: action.id },
        });
        return result;
      },
    );
  }

  private async apply(actorId: string, command: IConnectionCommand) {
    await this.assertOwner(actorId, command.storeId);
    const service = this.subject.module.subjectsToProviderIdentities;
    if (command.operation === "connect") {
      const identity = await this.subject.module.identity.createOutbound(
        command.provider,
      );
      const executor = await this.subject.create({
        data: { variant: "agent" },
      });
      const version = randomUUID();
      await this.vault.put(
        { storeId: command.storeId, identityId: identity.id, version },
        command.secret,
      );
      return service.create({
        data: {
          storeId: command.storeId,
          identityId: identity.id,
          subjectId: executor.id,
          ownerId: actorId,
          label: command.label,
          externalAccount: command.externalAccount,
          version,
        },
      });
    }
    const conn = await service.findById({ id: command.connectionId });
    if (!conn || conn.storeId !== command.storeId || conn.ownerId !== actorId) {
      throw new Error("Not found. Provider connection");
    }
    if (command.operation === "reconcile") {
      const key = `work:${command.attemptId}`;
      return this.subject.workLedger.changeProviderWork(
        conn.storeId,
        key,
        (record) => {
          if (
            !record ||
            record.connectionId !== conn.id ||
            !["unknown", "dispatching"].includes(record.state)
          ) {
            throw new Error(
              "Conflict error. This attempt cannot be reconciled",
            );
          }
          if (
            command.resolution &&
            (record.state !== "unknown" || record.resolution)
          ) {
            throw new Error(
              "Conflict error. An external statement requires an unresolved attempt",
            );
          }
          return {
            ...record,
            reconcileRequested: true,
            resolution: command.resolution
              ? {
                  ...command.resolution,
                  actorId,
                  recordedAt: new Date().toISOString(),
                }
              : record.resolution,
          };
        },
      );
    }
    if (command.operation === "fund") {
      const payment = {
        storeId: conn.storeId,
        taskId: command.taskId,
        senderId: actorId,
        recipientId: conn.subjectId,
        currencyId: command.currencyId,
        actorId,
        operationKey: command.operationKey,
        purpose: command.attemptId ? "provider-advance" : "provider-funding",
        amount: command.amount,
      };
      if (command.attemptId) {
        const key = `work:${command.attemptId}`;
        const original =
          await this.subject.module.subjectsToWalletOperations.byKey(
            conn.storeId,
            key,
          );
        if (original?.providerWork?.connectionId !== conn.id)
          throw new Error(
            "Forbidden error. Attempt belongs to another connection",
          );
        return this.subject.workLedger.advance(payment, key);
      }
      return this.subject.workLedger.transfer(payment);
    }
    if (
      command.operation === "assign" ||
      command.operation === "assign-default"
    ) {
      if (
        !conn.active ||
        (command.operation === "assign" &&
          command.assistantId === conn.subjectId) ||
        new Decimal(command.terms.usdPerSps).lte(0) ||
        new Decimal(command.terms.workMultiplier).lt(1) ||
        new Decimal(command.terms.maxCostUsd).lte(0)
      ) {
        throw new Error(
          "Validation error. Active provider and funded terms required",
        );
      }
      const assistantId =
        command.operation === "assign" ? command.assistantId : null;
      if (assistantId)
        await this.assertStoreAssistant(conn.storeId, assistantId);
      const bindings = this.subject.module.subjectsToProviderAgents;
      const existing = await this.binding(
        conn.storeId,
        assistantId,
        command.capability,
      );
      const data = {
        storeId: conn.storeId,
        subjectId: assistantId,
        executorId: conn.subjectId,
        identityId: conn.identityId,
        capability: command.capability,
        model: command.model,
        terms: command.terms,
      };
      if (existing) {
        return bindings.update({
          id: existing.id,
          data: { ...data, updatedAt: new Date() },
        });
      }
      return bindings.create({ data });
    }
    if (conn.version !== command.expectedVersion) {
      throw new Error("Conflict error. Provider connection changed");
    }
    if (command.operation === "revoke") {
      return service.update({
        id: conn.id,
        data: { active: false, updatedAt: new Date() },
      });
    }
    const version = randomUUID();
    await this.vault.put(
      { storeId: conn.storeId, identityId: conn.identityId, version },
      command.secret,
    );
    return service.update({
      id: conn.id,
      data: { active: true, version, updatedAt: new Date() },
    });
  }

  async suspend(storeId: string, connectionId: string, version: string) {
    await this.subject.repository.withWalletLocks(
      [`provider-store:${storeId}`],
      async () => {
        const service = this.subject.module.subjectsToProviderIdentities;
        const current = await service.findById({ id: connectionId });
        if (current?.storeId === storeId && current.version === version) {
          await service.update({
            id: connectionId,
            data: { active: false, updatedAt: new Date() },
          });
        }
      },
    );
  }

  private async assertStoreAssistant(storeId: string, subjectId: string) {
    const allowed =
      await this.subject.module.subjectsToEcommerceModuleStores.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: subjectId },
              {
                column: "ecommerceModuleStoreId",
                method: "eq",
                value: storeId,
              },
              { column: "variant", method: "eq", value: "assistant" },
            ],
          },
          limit: 1,
        },
      });
    const assistant = await this.subject.findById({ id: subjectId });
    if (!allowed.length || assistant?.variant !== "agent") {
      throw new Error(
        "Permission error. Assistant does not belong to the store",
      );
    }
  }

  private assignments(
    storeId: string,
    subjectId: string | null,
    capability?: IProviderCapability,
  ) {
    return this.subject.module.subjectsToProviderAgents.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            subjectId
              ? { column: "subjectId", method: "eq", value: subjectId }
              : { column: "subjectId", method: "isNull", value: null },
            ...(capability
              ? [
                  {
                    column: "capability",
                    method: "eq" as const,
                    value: capability,
                  },
                ]
              : []),
          ],
        },
      },
    });
  }

  private async binding(
    storeId: string,
    subjectId: string | null,
    capability: IProviderCapability,
  ) {
    return (await this.assignments(storeId, subjectId, capability))[0];
  }

  async resolve(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
  ) {
    await this.assertStoreAssistant(storeId, subjectId);
    const assigned =
      (await this.binding(storeId, subjectId, capability)) ??
      (await this.binding(storeId, null, capability));
    if (!assigned) {
      throw new Error(
        "Permission error. Provider capability is not assigned to this assistant",
      );
    }
    const [conn] = await this.subject.module.subjectsToProviderIdentities.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "identityId", method: "eq", value: assigned.identityId },
            { column: "subjectId", method: "eq", value: assigned.executorId },
            { column: "active", method: "eq", value: true },
          ],
        },
        limit: 1,
      },
    });
    if (!conn) {
      throw new Error("Permission error. Provider connection is inactive");
    }
    await this.assertOwner(conn.ownerId, storeId);
    const identity = await this.subject.module.identity.findById({
      id: conn.identityId,
    });
    if (identity?.usage !== "outbound_api") {
      throw new Error("Permission error. Outbound provider identity required");
    }
    return {
      connectionId: conn.id,
      identityId: conn.identityId,
      version: conn.version,
      ownerId: conn.ownerId,
      executorId: conn.subjectId,
      externalAccount: conn.externalAccount,
      provider: providerType.parse(identity.provider),
      model: assigned.model,
      terms: providerTerms.parse(assigned.terms),
    };
  }

  async credential(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
    expected: {
      identityId: string;
      version: string;
      model?: string;
      terms?: ReturnType<typeof providerTerms.parse>;
    },
  ) {
    const binding = await this.resolve(storeId, subjectId, capability);
    if (
      binding.identityId !== expected.identityId ||
      binding.version !== expected.version ||
      (expected.model !== undefined && binding.model !== expected.model) ||
      (expected.terms &&
        JSON.stringify(binding.terms) !== JSON.stringify(expected.terms))
    ) {
      throw new Error(
        "Conflict error. Provider credential changed before dispatch",
      );
    }
    return this.vault.read({ storeId, ...expected });
  }
}
