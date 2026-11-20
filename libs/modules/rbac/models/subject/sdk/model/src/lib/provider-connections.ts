import { z } from "zod";
import { providerReasoningEffortValues } from "@sps/shared-utils";

const text = z.string().trim().min(1).max(150);
const secret = z.string().min(8).max(8192).regex(/^\S+$/);
const money = z.string().regex(/^(0|[1-9]\d{0,15})(\.\d{1,12})?$/);
export const PROVIDER_MODEL_SELECTION_METADATA_KEY = "provider";
export const providerModelSelection = z
  .object({
    modelId: text,
    reasoning: z.enum(providerReasoningEffortValues).optional(),
  })
  .strict()
  .refine(({ modelId, reasoning }) => modelId !== "auto" || !reasoning, {
    path: ["reasoning"],
  });
export type IProviderModelSelection = z.infer<typeof providerModelSelection>;
export const providerType = z.enum(["openrouter", "openai"]);
export const providerCapability = z.enum([
  "text",
  "decision",
  "image",
  "transcription",
  "embedding",
  "vision",
  "compression",
]);
export const providerTerms = z
  .object({
    maxInputTokens: z.number().int().min(1).max(2_000_000),
    maxOutputTokens: z.number().int().min(1).max(512_000),
    maxCostUsd: money,
    inputUsdPerMillion: money,
    outputUsdPerMillion: money,
    audioUsdPerMinute: money.optional(),
    usdPerSps: money,
    workMultiplier: money,
    version: text,
  })
  .strict();
export const externalResolution = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("no-charge"), reference: text }).strict(),
  z
    .object({
      kind: z.literal("charged"),
      reference: text,
      usd: money,
      inputTokens: z.number().int().min(0).max(2_147_483_647),
      outputTokens: z.number().int().min(0).max(2_147_483_647),
    })
    .strict(),
]);
export const connectionCommand = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("connect"),
      storeId: z.uuid(),
      label: text,
      externalAccount: text,
      provider: providerType,
      executorId: z.uuid().optional(),
      secret,
    })
    .strict(),
  z
    .object({
      operation: z.literal("rotate"),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      expectedVersion: z.uuid(),
      secret,
    })
    .strict(),
  z
    .object({
      operation: z.literal("revoke"),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      expectedVersion: z.uuid(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("assign-default"),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      capability: providerCapability,
      model: text,
      terms: providerTerms,
    })
    .strict(),
  z
    .object({
      operation: z.literal("assign"),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      assistantId: z.uuid(),
      capability: providerCapability,
      model: text,
      terms: providerTerms,
    })
    .strict(),
  z
    .object({
      operation: z.literal("reconcile"),
      resolution: externalResolution.optional(),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      attemptId: z.uuid(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("fund"),
      attemptId: z.uuid().optional(),
      storeId: z.uuid(),
      connectionId: z.uuid(),
      currencyId: z.uuid(),
      taskId: z.uuid(),
      operationKey: text,
      amount: money,
    })
    .strict(),
]);
export type IConnectionCommand = z.infer<typeof connectionCommand>;
export type IProviderType = z.infer<typeof providerType>;
export type IProviderCapability = z.infer<typeof providerCapability>;
export type IProviderTerms = z.infer<typeof providerTerms>;

export interface IProviderSettings {
  nextCursor: string | null;
  assistants: Array<{ id: string; label: string }>;
  executorSubjects?: Array<{ id: string; label: string }>;
  connections: Array<
    Pick<
      import("@sps/rbac/relations/subjects-to-provider-identities/sdk/model").IModel,
      | "id"
      | "identityId"
      | "subjectId"
      | "label"
      | "externalAccount"
      | "version"
      | "active"
    > & { provider: IProviderType }
  >;
  assignments: import("@sps/rbac/relations/subjects-to-provider-agents/sdk/model").IModel[];
  operations: import("@sps/rbac/relations/subjects-to-wallet-operations/sdk/model").IModel[];
}

export interface IProviderChatModelOption {
  id: string;
  /** Favorite identity shared by equivalent model codes. Dispatch uses id. */
  canonicalId?: string;
  name: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  supportsReasoning: boolean;
  reasoning: import("@sps/shared-utils").IProviderModelReasoning | null;
}

export interface IProviderChatModelGroup {
  id: "text" | "vision_file" | "image" | "audio";
  title: string;
  models: IProviderChatModelOption[];
}

export interface IProviderChatModelsResult {
  auto: {
    id: "auto";
    name: string;
    description: string;
  };
  groups: IProviderChatModelGroup[];
}
