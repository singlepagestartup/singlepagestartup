import { z } from "zod";
import type { IWorkRequest } from "../open-router/work-request";
import type {
  IOpenRouterRequestMessage,
  IOpenRouterResponseFormat,
} from "../open-router";

const reasoningItem = z.object({
  id: z.string(),
  type: z.literal("reasoning"),
  encrypted_content: z.string().min(1),
});
export const workResponseState = z.object({
  callItemId: z.string().optional(),
  reasoning: z.array(reasoningItem),
});
export type TWorkResponseState = z.infer<typeof workResponseState>;

/** Encrypted reasoning stays in the paid work attempt for stateless continuation. */
export function workResponsesInput(
  request: IWorkRequest,
  format?: IOpenRouterResponseFormat,
  messages: IOpenRouterRequestMessage[] = request.messages,
) {
  const input: unknown[] = messages.map((message) => {
    if (typeof message.content === "string") {
      return message;
    }
    const content = message.content.map((part) => {
      switch (part.type) {
        case "text":
          return { type: "input_text", text: part.text };
        case "image_url":
          return {
            type: "input_image",
            detail: part.image_url.detail,
            image_url: part.image_url.url,
          };
        case "file":
          return {
            type: "input_file",
            filename: part.file.filename,
            file_data: part.file.file_data,
          };
        case "input_audio":
          return part;
        default:
          throw new Error("Unsupported Responses input part");
      }
    });
    return { role: message.role, content };
  });
  for (const entry of request.toolHistory ?? []) {
    if (entry.role === "tool") {
      input.push({
        type: "function_call_output",
        call_id: entry.tool_call_id,
        output: entry.content,
      });
    }
    for (const call of entry.tool_calls ?? []) {
      const state = request.responseStates?.[call.id];
      for (const item of state?.reasoning ?? []) {
        input.push({ ...item, summary: [] });
      }
      input.push({
        type: "function_call",
        id: state?.callItemId,
        call_id: call.id,
        ...call.function,
      });
    }
  }
  return {
    model: request.model,
    input,
    ...(request.reasoning && { reasoning: { effort: request.reasoning } }),
    ...(request.tools?.length
      ? {
          tools: request.tools.map(({ type, function: fn }) => ({
            type,
            ...fn,
            strict: fn.strict ?? false,
          })),
          tool_choice: "auto",
          parallel_tool_calls: false,
        }
      : format && {
          text: {
            format:
              format.type === "json_schema"
                ? { type: format.type, ...format.json_schema }
                : format,
          },
        }),
  };
}

export function workResponsesBody(
  request: IWorkRequest,
  format: IOpenRouterResponseFormat | undefined,
  messages: IOpenRouterRequestMessage[],
) {
  return {
    ...workResponsesInput(request, format, messages),
    store: false,
    service_tier: "default",
    max_output_tokens: request.maxOutputTokens,
    ...(request.tools?.length && { include: ["reasoning.encrypted_content"] }),
  };
}

const outputItem = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reasoning"),
    id: z.string(),
    encrypted_content: z.string().nullish(),
  }),
  z.object({
    type: z.literal("function_call"),
    id: z.string().optional(),
    call_id: z.string(),
    name: z.string(),
    arguments: z.string(),
  }),
  z.object({
    type: z.literal("message"),
    content: z.array(
      z.object({ type: z.string(), text: z.string().optional() }),
    ),
  }),
]);
const workResponse = z.object({
  id: z.string(),
  status: z.enum(["completed", "incomplete"]),
  output: z.array(outputItem),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    input_tokens_details: z
      .object({
        cached_tokens: z.number().optional(),
        cache_write_tokens: z.number().optional(),
        audio_tokens: z.number().optional(),
      })
      .nullish(),
  }),
});

export function readWorkResponse(payload: unknown) {
  const response = workResponse.safeParse(payload).data;
  if (!response) return undefined;
  const completed = response.status === "completed";
  const calls = response.output.filter(
    (item) => item.type === "function_call" && completed,
  );
  const call =
    calls.length === 1 && calls[0].type === "function_call"
      ? calls[0]
      : undefined;
  const reasoning = response.output.flatMap((item) => {
    const valid = reasoningItem.safeParse(item).data;
    return valid ? [valid] : [];
  });
  const text = response.output
    .flatMap((item) =>
      item.type === "message" && completed
        ? item.content.flatMap((part) =>
            part.type === "output_text" && part.text ? [part.text] : [],
          )
        : [],
    )
    .join("\n");
  return {
    state: call ? { callItemId: call.id, reasoning } : undefined,
    completion: {
      id: response.id,
      choices: [
        {
          message: {
            content: text,
            tool_calls: call
              ? [
                  {
                    id: call.call_id,
                    type: "function",
                    function: { name: call.name, arguments: call.arguments },
                  },
                ]
              : undefined,
          },
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        prompt_tokens_details: response.usage.input_tokens_details,
      },
    },
  };
}
