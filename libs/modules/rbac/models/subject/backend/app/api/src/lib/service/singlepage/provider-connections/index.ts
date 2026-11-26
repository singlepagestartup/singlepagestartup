import { randomUUID } from "node:crypto";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import Decimal from "decimal.js";
import {
  OPEN_AI_IMAGE_WORK_MODEL,
  TRANSCRIPTION_USD_PER_MINUTE,
  providerModelReasoning,
  supportsImageWork,
} from "@sps/shared-third-parties";
import {
  stageWorkFunding,
  type IFunnelStage,
  type IWorkFunding,
} from "@sps/crm/models/funnel/sdk/model";
import { isStoreEmployeeTraining } from "@sps/crm/models/task/sdk/model";
import { isStoreTest } from "@sps/rbac/models/subject/sdk/model/src/lib/customer-work";
import {
  KNOWLEDGE_OPEN_AI_EMBEDDING_MODEL,
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
  OPEN_AI_STAGE_TEXT_REASONING,
  providerModelFavoriteId,
} from "@sps/shared-utils";
import { TokenTopupRate } from "../billing/token-topup-rate";
import { ProviderSecretStore } from "./secret-store";
import type { SubjectServiceDependencies } from "../index";
import {
  connectionCommand,
  providerTerms,
  providerType,
  type IConnectionCommand,
  type IProviderCapability,
  type IProviderChatModelOption,
  type IProviderChatModelsResult,
  type IProviderType,
  type IProviderModelSelection,
  type IProviderTerms,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";

const providerAgentGrantVariants = ["assistant", "crm-agent"];

interface IWorkProviderScope {
  payer: IWorkFunding["payer"];
  preferredOwnerId?: string;
  customerPricing?: ICustomerPricing;
}

interface ICustomerPricing {
  multiplier: string;
  currencyId: string;
}

type TServerWorkFundingTerms = Partial<
  Pick<
    IProviderTerms,
    | "workMultiplier"
    | "usdPerSps"
    | "topupProductId"
    | "topupTokens"
    | "topupUsd"
  >
>;

interface IWorkModelSelection extends Partial<IProviderModelSelection> {
  provider?: IProviderType;
}

// OpenAI Standard pricing per million tokens within the server's 50k input cap.
// https://developers.openai.com/api/docs/models/gpt-6.2-astra
const astraText = {
  model: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
  inputUsdPerMillion: "8",
  cachedInputUsdPerMillion: "0.40",
  cacheWriteUsdPerMillion: "10",
  outputUsdPerMillion: "40",
};
const legacyText = {
  model: "gpt-5.4-mini-2026-03-17",
  inputUsdPerMillion: "0.75",
  cachedInputUsdPerMillion: "0.075",
  outputUsdPerMillion: "4.50",
};
const auxiliaryText = {
  model: "gpt-4.1-mini",
  inputUsdPerMillion: "0.40",
  cachedInputUsdPerMillion: "0.10",
  outputUsdPerMillion: "1.60",
};
const serverTerms: IProviderTerms = {
  maxInputTokens: 50_000,
  maxOutputTokens: 2048,
  maxCostUsd: "0.75",
  inputUsdPerMillion: "0",
  outputUsdPerMillion: "0",
  usdPerSps: "0.05",
  workMultiplier: "1",
  version: "2026-11-openai-store-work",
};
const serverModels = {
  text: [astraText, legacyText, auxiliaryText],
  decision: [auxiliaryText],
  compression: [auxiliaryText],
  vision: [auxiliaryText],
  image: [
    {
      model: OPEN_AI_IMAGE_WORK_MODEL,
      maxOutputTokens: 16_384,
      inputUsdPerMillion: "8",
      outputUsdPerMillion: "30",
    },
  ],
  embedding: [
    { model: KNOWLEDGE_OPEN_AI_EMBEDDING_MODEL, inputUsdPerMillion: "0.13" },
  ],
  transcription: [
    {
      model: "gpt-transcribe",
      audioUsdPerMinute: TRANSCRIPTION_USD_PER_MINUTE,
    },
  ],
} satisfies Record<
  IProviderCapability,
  ({ model: string } & Partial<IProviderTerms>)[]
>;

export class ServerWorkCredentialUnavailable extends Error {
  constructor() {
    super("Permission error. The server OpenAI work key is unavailable");
  }
}

function serverCredential() {
  const secret = process.env.OPEN_AI_API_KEY?.trim();
  if (!secret) {
    throw new ServerWorkCredentialUnavailable();
  }
  return secret;
}

export class ProviderConnections {
  constructor(
    private readonly subject: SubjectServiceDependencies<
      "repository" | "create" | "findById" | "workLedger" | "crmWorkspace"
    >,
    private readonly vault = new ProviderSecretStore(),
  ) {}

  private async isOwner(actorId: string, storeId: string) {
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
    return Boolean(owners.length);
  }

  private async assertOwner(actorId: string, storeId: string) {
    if (!(await this.isOwner(actorId, storeId))) {
      throw new Error("Permission error. Store ownership required");
    }
  }

  async chatModels(
    customerId: string,
    profileId: string,
    chatId: string,
    threadId?: string,
  ): Promise<IProviderChatModelsResult> {
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
    if (!owned.length || !member.length) {
      throw new Error("Forbidden error. Profile is outside this chat");
    }
    const threads = await social.chatsToThreads.find({
      params: {
        filters: {
          and: [
            { column: "chatId", method: "eq", value: chatId },
            ...(threadId
              ? [{ column: "threadId", method: "eq" as const, value: threadId }]
              : []),
          ],
        },
      },
    });
    if (threadId && !threads.length) {
      throw new Error("Forbidden error. Thread is outside this chat");
    }
    const models = new Map<
      string,
      Omit<
        IProviderChatModelOption,
        "reasoning" | "supportsReasoning" | "supportedParameters"
      > & {
        provider: IProviderType;
        kind: "text" | "image";
        storeText?: boolean;
      }
    >();
    const chat = await social.chat.findById({ id: chatId });
    const employeeChat =
      chat?.variant === STORE_EMPLOYEE_CHAT_VARIANT
        ? await this.subject.crmWorkspace.employees.scopeForChat(
            customerId,
            chat,
            threadId,
          )
        : undefined;
    if (employeeChat && employeeChat.actorProfileId !== profileId) {
      throw new Error(
        "Forbidden error. Profile is outside this employee conversation",
      );
    }
    let fixedStageModel: IProviderModelSelection | undefined;
    for (const thread of threads) {
      const scope = employeeChat
        ? {
            storeId: employeeChat.storeId,
            assigneeId: employeeChat.subjectId,
            kind: "text" as const,
            customerPays: false,
            fixedModel: undefined,
          }
        : await this.modelScopeForTask(customerId, thread.threadId);
      if (!scope) {
        continue;
      }
      if (scope.fixedModel) {
        if (threadId) {
          fixedStageModel = scope.fixedModel;
        }
        continue;
      }
      const { storeId, assigneeId, kind, customerPays } = scope;
      if (!customerPays) {
        if (!process.env.OPEN_AI_API_KEY?.trim()) {
          continue;
        }
        await this.assertStoreAgent(storeId, assigneeId);
        for (const model of kind === "text"
          ? [astraText]
          : serverModels.image) {
          models.set(`${model.model}:${kind}`, {
            id: model.model,
            canonicalId: providerModelFavoriteId(model.model),
            name:
              kind === "text" ? OPEN_AI_STAGE_TEXT_MODEL_LABEL : model.model,
            storeText: kind === "text",
            description: "OpenAI API",
            contextLength: serverTerms.maxInputTokens,
            provider: "openai",
            kind,
            inputModalities: kind === "image" ? ["text", "image"] : ["text"],
            outputModalities: [kind],
          });
        }
        continue;
      }
      const bindings = await this.availableBindings(storeId, assigneeId, kind);
      const assigned = bindings.slice(0, 1);
      const seen = new Set<string>();
      for (const binding of assigned) {
        if (seen.has(binding.model)) {
          continue;
        }
        seen.add(binding.model);
        const connection = await this.activeConnection(storeId, binding);
        if (
          !connection ||
          !(await this.isOwner(connection.ownerId, storeId)) ||
          (kind === "image" &&
            !supportsImageWork(connection.provider, binding.model))
        ) {
          continue;
        }
        const key = binding.model + ":" + kind;
        if (models.has(key)) {
          continue;
        }
        models.set(key, {
          id: binding.model,
          canonicalId: providerModelFavoriteId(binding.model),
          provider: connection.provider,
          kind,
          name: binding.model,
          description:
            connection.provider === "openai" ? "OpenAI API" : "OpenRouter",
          contextLength: connection.terms.maxInputTokens,
          inputModalities:
            kind === "image" && connection.provider === "openai"
              ? ["text", "image"]
              : ["text"],
          outputModalities: [kind],
        });
      }
    }
    const options = await Promise.all(
      [...models.values()].map(
        async ({ provider, kind, storeText, ...model }) => {
          let reasoning: IProviderChatModelOption["reasoning"] = null;
          if (kind === "text") {
            reasoning = await providerModelReasoning(provider, model.id);
            if (reasoning && storeText) {
              reasoning = {
                ...reasoning,
                defaultEffort: OPEN_AI_STAGE_TEXT_DEFAULT.reasoning,
                supportedEfforts: [...OPEN_AI_STAGE_TEXT_REASONING],
              };
            }
          }
          const supportedParameters: string[] = [];
          if (reasoning) {
            supportedParameters.push(
              provider === "openai" ? "reasoning_effort" : "reasoning",
            );
          }
          return {
            ...model,
            supportedParameters,
            supportsReasoning: Boolean(reasoning),
            reasoning,
          };
        },
      ),
    );
    const groups = (["text", "image"] as const).map((kind) => ({
      id: kind,
      title: kind === "text" ? "Text" : "Image",
      models: options.filter((model) => model.outputModalities.includes(kind)),
    }));
    return {
      ...(fixedStageModel && {
        stageModelFixed: true,
        stageModelId: fixedStageModel.modelId,
        stageModelReasoning: fixedStageModel.reasoning,
      }),
      auto: {
        id: "auto",
        name: "Auto",
        description: "Use the default model for this stage.",
      },
      groups: groups.filter((group) => group.models.length),
    };
  }

  private async modelScopeForTask(customerId: string, threadId: string) {
    const social = this.subject.modules.social;
    const link = await social.chatsToCrmModuleTasks.forThread(threadId);
    if (!link) {
      return;
    }
    const task = await this.subject.modules.crm.task.findById({
      id: link.crmModuleTaskId,
    });
    if (
      !task ||
      task.customerId !== customerId ||
      task.status !== "active" ||
      task.assigneeKind !== "ai" ||
      !task.assigneeId
    ) {
      return;
    }
    const funnel = await this.subject.modules.crm.task.getFunnel({
      storeId: task.storeId,
      taskId: task.id,
    });
    const stage = funnel.definition.stages.find(
      ({ id }) => id === task.stageId,
    );
    const funding = stage && stageWorkFunding(funnel.definition, stage);
    if (!stage || !funding) {
      return;
    }
    const kind: "image" | "text" = stage.output === "image" ? "image" : "text";
    const customerPays =
      funding.payer === "customer" && funding.multiplier === undefined;
    let fixedModel = stage.provider;
    if (
      kind === "text" &&
      !customerPays &&
      fixedModel?.modelId === OPEN_AI_STAGE_TEXT_DEFAULT.modelId &&
      !fixedModel.reasoning
    ) {
      fixedModel = OPEN_AI_STAGE_TEXT_DEFAULT;
    }
    return {
      storeId: task.storeId,
      assigneeId: task.assigneeId,
      kind,
      customerPays,
      fixedModel,
    };
  }

  async list(actorId: string, storeId: string, before?: string) {
    await this.assertOwner(actorId, storeId);
    const linksService = this.subject.module.subjectsToIdentities;
    const [connections, assignments] = await Promise.all([
      linksService.providerConnections(storeId),
      linksService.providerAssignments(storeId),
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
          const identity =
            await this.subject.module.identity.outboundProvider(identityId);
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
      await this.subject.modules.billing.transaction.history(storeId, before);
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
              {
                column: "variant",
                method: "inArray",
                value: providerAgentGrantVariants,
              },
            ],
          },
          limit: 100,
        },
      });
    const agentIds = new Set(links.map(({ subjectId }) => subjectId));
    const employees = this.subject.crmWorkspace.employees;
    const agents = await Promise.all(
      [...agentIds].map(async (id) => {
        const agent = await this.subject.findById({ id });
        if (agent?.variant !== "agent") {
          return undefined;
        }
        const profile = await employees.agentProfile(id);
        const name = profile ? employees.name(profile).trim() : "";
        return { id: agent.id, label: name || agent.slug };
      }),
    );
    const assistants = agents.filter((agent) => agent !== undefined);
    return {
      connections: visible,
      assignments,
      operations,
      assistants,
      executorSubjects: Array.from(
        new Map(
          connections
            .filter(({ ownerId }) => ownerId === actorId)
            .map(({ subjectId, label }) => [
              subjectId,
              { id: subjectId, label },
            ]),
        ).values(),
      ),
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
    const service = this.subject.module.subjectsToIdentities;
    if (command.operation === "connect") {
      let executorId = command.executorId;
      if (executorId) {
        const [existing] = await service.providerConnections(command.storeId, {
          ownerId: actorId,
          subjectId: executorId,
        });
        if (!existing) {
          throw new Error(
            "Permission error. Technical subject is outside this connection scope",
          );
        }
      } else {
        const executor = await this.subject.create({
          data: { variant: "provider-agent" },
        });
        executorId = executor.id;
      }
      const identity = await this.subject.module.identity.createOutbound(
        command.provider,
      );
      const version = randomUUID();
      await this.vault.put(
        { storeId: command.storeId, identityId: identity.id, version },
        command.secret,
      );
      return service.createProviderConnection({
        storeId: command.storeId,
        identityId: identity.id,
        subjectId: executorId,
        ownerId: actorId,
        label: command.label,
        externalAccount: command.externalAccount,
        version,
      });
    }
    const [conn] = await service.providerConnections(command.storeId, {
      id: command.connectionId,
    });
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
        const original = await this.subject.modules.billing.transaction.byKey(
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
        command.model === "auto" ||
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
      if (assistantId) await this.assertStoreAgent(conn.storeId, assistantId);
      const data = {
        storeId: conn.storeId,
        subjectId: assistantId,
        executorId: conn.subjectId,
        identityId: conn.identityId,
        capability: command.capability,
        model: command.model,
        terms: command.terms,
      };
      return service.setProviderAssignment(data);
    }
    if (conn.version !== command.expectedVersion) {
      throw new Error("Conflict error. Provider connection changed");
    }
    if (command.operation === "revoke") {
      return service.updateProviderConnection(command.storeId, conn.id, {
        active: false,
      });
    }
    const version = randomUUID();
    await this.vault.put(
      { storeId: conn.storeId, identityId: conn.identityId, version },
      command.secret,
    );
    return service.updateProviderConnection(command.storeId, conn.id, {
      active: true,
      version,
    });
  }

  async suspend(storeId: string, connectionId: string, version: string) {
    await this.subject.repository.withWalletLocks(
      [`provider-store:${storeId}`],
      async () => {
        const service = this.subject.module.subjectsToIdentities;
        const [current] = await service.providerConnections(storeId, {
          id: connectionId,
        });
        if (current?.storeId === storeId && current.version === version) {
          await service.updateProviderConnection(storeId, connectionId, {
            active: false,
          });
        }
      },
    );
  }

  private async assertStoreAgent(storeId: string, subjectId: string) {
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
              {
                column: "variant",
                method: "inArray",
                value: providerAgentGrantVariants,
              },
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
    return this.subject.module.subjectsToIdentities.providerAssignments(
      storeId,
      { subjectId, capability },
    );
  }

  private async binding(
    storeId: string,
    subjectId: string | null,
    capability: IProviderCapability,
  ) {
    return (await this.assignments(storeId, subjectId, capability))[0];
  }

  private async availableBindings(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
  ) {
    await this.assertStoreAgent(storeId, subjectId);
    const [personal, shared] = await Promise.all([
      this.binding(storeId, subjectId, capability),
      this.binding(storeId, null, capability),
    ]);
    return [personal, shared].filter(
      (binding): binding is NonNullable<typeof binding> => Boolean(binding),
    );
  }

  private async activeConnection(
    storeId: string,
    assigned: NonNullable<Awaited<ReturnType<ProviderConnections["binding"]>>>,
  ) {
    const [conn] =
      await this.subject.module.subjectsToIdentities.providerConnections(
        storeId,
        {
          identityId: assigned.identityId,
          subjectId: assigned.executorId,
          active: true,
        },
      );
    if (!conn) {
      return;
    }
    const identity = await this.subject.module.identity.outboundProvider(
      conn.identityId,
    );
    const provider = providerType.safeParse(identity?.provider);
    if (!provider.success) {
      return;
    }
    return {
      connectionId: conn.id,
      identityId: conn.identityId,
      version: conn.version,
      ownerId: conn.ownerId,
      executorId: conn.subjectId,
      externalAccount: conn.externalAccount,
      provider: provider.data,
      model: assigned.model,
      terms: providerTerms.parse(assigned.terms),
    };
  }

  async resolve(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
    selection?: IWorkModelSelection & { defaultOnly?: boolean },
  ) {
    const { modelId: requestedModelId, reasoning } = selection ?? {};
    const explicit =
      requestedModelId !== undefined && requestedModelId !== "auto";
    if (reasoning && (!explicit || capability !== "text")) {
      throw new Error(
        "Validation error. Reasoning effort requires a selected text model",
      );
    }
    const bindings = await this.availableBindings(
      storeId,
      subjectId,
      capability,
    );
    const allowed = selection?.defaultOnly ? bindings.slice(0, 1) : bindings;
    const assigned = explicit
      ? allowed.find(({ model }) => model === requestedModelId)
      : allowed[0];
    if (!assigned) {
      throw new Error(
        explicit
          ? "Validation error. The selected model is unavailable for this stage"
          : "Permission error. Provider capability is not assigned to this assistant",
      );
    }
    const connection = await this.activeConnection(storeId, assigned);
    if (!connection) {
      throw new Error("Permission error. Provider connection is inactive");
    }
    if (selection?.provider && connection.provider !== selection.provider) {
      throw new Error(
        "Validation error. The selected provider is unavailable for this stage",
      );
    }
    if (
      capability === "image" &&
      !supportsImageWork(connection.provider, connection.model)
    ) {
      throw new Error(
        "Validation error. This model does not support image work",
      );
    }
    await this.assertOwner(connection.ownerId, storeId);
    if (reasoning) {
      const options = await providerModelReasoning(
        connection.provider,
        connection.model,
      );
      if (!options?.supportedEfforts.includes(reasoning)) {
        throw new Error(
          "Validation error. The selected reasoning effort is unavailable for this model",
        );
      }
    }
    return connection;
  }

  async resolveWork(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
    scope: IWorkProviderScope,
    selection?: IWorkModelSelection,
  ) {
    if (scope.payer === "customer" && !scope.customerPricing) {
      const connection = await this.resolve(storeId, subjectId, capability, {
        ...selection,
        defaultOnly: true,
      });
      return {
        ...connection,
        mode: "identity" as const,
        reasoning: selection?.reasoning,
      };
    }

    await this.assertStoreAgent(storeId, subjectId);
    serverCredential();
    const { model, prices, reasoning } = await this.serverWorkModel(
      capability,
      selection,
    );
    let ownerId = scope.preferredOwnerId;
    if (ownerId) {
      await this.assertOwner(ownerId, storeId);
    } else {
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
                { column: "variant", method: "eq", value: "owner" },
              ],
            },
            limit: 2,
          },
        });
      if (owners.length !== 1) {
        throw new Error(
          "Permission error. Select the store owner who pays for this stage",
        );
      }
      ownerId = owners[0].subjectId;
    }
    const fundingTerms = await this.serverWorkFundingTerms(
      scope.customerPricing,
    );
    return {
      mode: "server" as const,
      ownerId,
      provider: "openai" as const,
      externalAccount: "server",
      model,
      reasoning,
      terms: { ...serverTerms, ...prices, ...fundingTerms },
    };
  }

  private async serverWorkModel(
    capability: IProviderCapability,
    selection?: IWorkModelSelection,
  ) {
    if (selection?.provider && selection.provider !== "openai") {
      throw new Error(
        "Validation error. The selected provider is unavailable for this stage",
      );
    }
    const { modelId, reasoning } = selection ?? {};
    const explicit = Boolean(modelId && modelId !== "auto");
    const allowed: readonly ({ model: string } & Partial<IProviderTerms>)[] =
      serverModels[capability];
    const chosen = explicit
      ? allowed.find(({ model }) => model === modelId)
      : allowed[0];
    if (!chosen) {
      throw new Error(
        "Validation error. The selected model is unavailable for this stage",
      );
    }
    const usesAstra = capability === "text" && chosen.model === astraText.model;
    if (reasoning) {
      const options =
        explicit && capability === "text"
          ? await providerModelReasoning("openai", chosen.model)
          : undefined;
      if (
        !options?.supportedEfforts.includes(reasoning) ||
        (usesAstra &&
          !OPEN_AI_STAGE_TEXT_REASONING.some((effort) => effort === reasoning))
      ) {
        throw new Error(
          "Validation error. The selected reasoning effort is unavailable for this model",
        );
      }
    }
    const { model, ...prices } = chosen;
    return {
      model,
      prices,
      reasoning:
        reasoning ??
        (usesAstra ? OPEN_AI_STAGE_TEXT_DEFAULT.reasoning : undefined),
    };
  }

  async serverWorkFundingTerms(
    customerPricing?: ICustomerPricing,
  ): Promise<TServerWorkFundingTerms> {
    if (!customerPricing) {
      return {};
    }
    const { currencyId, multiplier: workMultiplier } = customerPricing;
    const topup = new Decimal(workMultiplier).gt(0)
      ? await new TokenTopupRate(this.subject.modules.ecommerce.product).read(
          currencyId,
        )
      : undefined;
    return { workMultiplier, ...topup };
  }

  async serverWorkRate(
    capability: IProviderCapability,
    fundingTerms: TServerWorkFundingTerms,
    selection?: IWorkModelSelection,
  ) {
    const { model, prices } = await this.serverWorkModel(capability, selection);
    return {
      model,
      provider: "openai" as const,
      capability,
      ...serverTerms,
      ...prices,
      ...fundingTerms,
    };
  }

  selectableServerRates(
    capability: IProviderCapability,
    terms: IProviderTerms,
  ) {
    return serverModels[capability].map(({ model, ...prices }) => ({
      model,
      provider: "openai" as const,
      capability,
      ...serverTerms,
      ...prices,
      usdPerSps: terms.usdPerSps,
      workMultiplier: terms.workMultiplier,
      ...(terms.topupProductId &&
        terms.topupUsd &&
        terms.topupTokens && {
          topupProductId: terms.topupProductId,
          topupUsd: terms.topupUsd,
          topupTokens: terms.topupTokens,
        }),
    }));
  }

  workScope(
    task: { customerId: string; openingKey?: string | null },
    stage: Pick<IFunnelStage, "payerSubjectId" | "workFunding">,
    funding: IWorkFunding,
    initiatingOwnerId?: string,
  ): IWorkProviderScope {
    let fallbackOwnerId = initiatingOwnerId;
    if (
      isStoreTest(task.openingKey) ||
      isStoreEmployeeTraining(task.openingKey)
    ) {
      fallbackOwnerId = task.customerId;
    }
    return {
      payer: funding.payer,
      ...(funding.multiplier !== undefined && {
        customerPricing: {
          multiplier: funding.multiplier,
          currencyId: funding.currencyId,
        },
      }),
      preferredOwnerId:
        stage.workFunding?.payerSubjectId ??
        stage.payerSubjectId ??
        fallbackOwnerId,
    };
  }

  savedCredential(storeId: string, identityId: string, version: string) {
    return this.vault.read({ storeId, identityId, version });
  }

  workCredential(
    storeId: string,
    subjectId: string,
    capability: IProviderCapability,
    binding: Awaited<ReturnType<ProviderConnections["resolveWork"]>>,
    selection?: IWorkModelSelection,
  ) {
    if (binding.mode === "server") {
      return serverCredential();
    }
    return this.credential(storeId, subjectId, capability, binding, {
      ...selection,
      defaultOnly: true,
    });
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
    selection?: Parameters<ProviderConnections["resolve"]>[3],
  ) {
    const binding = await this.resolve(
      storeId,
      subjectId,
      capability,
      selection,
    );
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
