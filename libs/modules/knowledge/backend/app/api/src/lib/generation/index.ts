import {
  IKnowledgeGenerationUsage,
  KnowledgeModelProvider,
} from "@sps/knowledge/sdk/model";
import { KnowledgeSearchResult } from "../types";
import { createLlmGatewayNetworkError } from "../llm-gateway-error";

const KNOWLEDGE_GENERATION_MAX_OUTPUT_TOKENS = 1800;
const NO_CONTEXT_ANSWER = "No indexed knowledge fragments matched the query.";

export interface KnowledgeGenerationResult {
  answer: string;
  model: string;
  provider?: KnowledgeModelProvider;
  providerModel?: string;
  usage?: IKnowledgeGenerationUsage;
}

export interface KnowledgeGenerationProps {
  query: string;
  contexts: KnowledgeSearchResult[];
  model: string;
  persona?: {
    title?: string | null;
    description?: unknown;
  };
  skillInstructions?: {
    id: string;
    slug: string;
    title?: string | null;
    instructions: string;
  }[];
  chatHistory?: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export interface KnowledgeChatCompletionProps {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  maxTokens?: number;
  temperature?: number;
}

export interface LlmChatClientProps {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export class LlmChatClient {
  private baseUrl: string;
  private fetcher: typeof fetch;

  constructor(props: LlmChatClientProps) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, "");
    this.fetcher = props.fetcher || fetch;
  }

  async generate(
    props: KnowledgeGenerationProps,
  ): Promise<KnowledgeGenerationResult> {
    if (
      !props.contexts.length &&
      !props.skillInstructions?.length &&
      !props.chatHistory?.length
    ) {
      return { answer: NO_CONTEXT_ANSWER, model: props.model };
    }

    return this.complete({
      model: props.model,
      maxTokens: KNOWLEDGE_GENERATION_MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildGroundedPrompt(props),
        },
      ],
    });
  }

  async complete(
    props: KnowledgeChatCompletionProps,
  ): Promise<KnowledgeGenerationResult> {
    let res: Response;

    try {
      res = await this.fetcher(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: props.model,
          stream: false,
          max_tokens: props.maxTokens ?? KNOWLEDGE_GENERATION_MAX_OUTPUT_TOKENS,
          temperature: props.temperature ?? 0.2,
          messages: props.messages,
        }),
      });
    } catch (error) {
      throw createLlmGatewayNetworkError({
        operation: "LLM generation request",
        baseUrl: this.baseUrl,
        model: props.model,
        error,
      });
    }

    if (!res.ok) {
      const body = await res.text();
      const details = body ? ` Response: ${body.slice(0, 500)}` : "";

      throw new Error(
        `LLM generation request failed with status ${res.status}.${details} Ensure apps/llm is running and model ${props.model} is available. Run: npm run llm:dev.`,
      );
    }

    const json = (await res.json()) as {
      model?: string;
      provider?: KnowledgeModelProvider;
      provider_model?: string;
      choices?: {
        message?: {
          content?: string;
        };
      }[];
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    return {
      answer: json.choices?.[0]?.message?.content?.trim() || "",
      model: json.model || props.model,
      provider: json.provider,
      providerModel: json.provider_model,
      usage: compactUsage({
        inputTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
        totalTokens: json.usage?.total_tokens,
      }),
    };
  }
}

export function buildGroundedPrompt(
  props: Omit<KnowledgeGenerationProps, "model">,
) {
  const contextText = props.contexts.length
    ? props.contexts
        .map((context, index) => {
          return [
            `Source ${index + 1}: ${context.sourceTitle || "Untitled"}`,
            `Path: ${context.sourceOriginalPath || "unknown"}`,
            `Similarity: ${formatSimilarity(context.similarity)}`,
            `Retrieval role: ${context.retrievalRole}`,
            context.text,
          ].join("\n");
        })
        .join("\n\n---\n\n")
    : "No indexed knowledge fragments matched the query.";
  const skillInstructionsText = props.skillInstructions?.length
    ? props.skillInstructions
        .map((skill) => {
          return [
            `@${skill.slug}${skill.title ? ` (${skill.title})` : ""}`,
            skill.instructions,
          ].join("\n");
        })
        .join("\n\n---\n\n")
    : "No selected skills.";
  const historyText = props.chatHistory?.length
    ? props.chatHistory
        .map((message) => {
          return `${message.role}: ${message.content}`;
        })
        .join("\n")
    : "No previous messages.";
  const personaTitle = props.persona?.title || "Knowledge expert";
  const personaDescription =
    typeof props.persona?.description === "string"
      ? props.persona.description
      : props.persona?.description
        ? JSON.stringify(props.persona.description)
        : "";

  const sourceInstruction = props.contexts.length
    ? "Use conversation history to resolve follow-ups, and use the provided knowledge fragments for factual grounding."
    : "Use conversation history to answer follow-ups. If the needed source text is not in the history, say that the conversation does not contain enough context.";

  return [
    sourceInstruction,
    `Use the selected persona as the expert role: ${personaTitle}.`,
    personaDescription ? `Persona context: ${personaDescription}` : "",
    "Answer in the same language as the user's query. If the query is in Russian, answer in Russian.",
    "Disambiguate ambiguous terms strictly from context. For example, Delta can mean an airline, a mathematical change, or a river delta; separate these meanings explicitly and ask a clarification if the fragments do not prove which meaning is intended.",
    "If the fragments do not support a claim, say that the indexed sources do not contain it.",
    "When the query asks to edit, format, rewrite, or refine prior text, use the conversation history as the source text and preserve the requested subject instead of replacing it with unrelated knowledge fragments.",
    "When selected skills are provided, follow their instructions for formatting, tone, and task behavior. Use the user's query as source material when the query contains the needed content.",
    "Cite source titles inline where useful.",
    "",
    "Selected skills:",
    skillInstructionsText,
    "",
    "Conversation history:",
    historyText,
    "",
    `Query: ${props.query}`,
    "",
    "Knowledge fragments:",
    contextText,
  ].join("\n");
}

function formatSimilarity(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return value.toFixed(3);
}

function compactUsage(usage: IKnowledgeGenerationUsage) {
  const entries = Object.entries(usage).filter(([, value]) => {
    return typeof value === "number";
  });

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries) as IKnowledgeGenerationUsage;
}
