import { OPEN_ROUTER_API_KEY } from "@sps/shared-utils";

export interface IOpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: number | string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: ("text" | "image" | "file")[];
    output_modalities: ("text" | "image" | "file")[];
    tokenizer:
      | "GPT"
      | "Claude"
      | "Gemini"
      | "Grok"
      | "Cohere"
      | "Nova"
      | "Qwen"
      | "Yi"
      | "DeepSeek"
      | "Mistral"
      | "Llama2"
      | "Llama3"
      | "Llama4"
      | "RWKV"
      | "Qwen3"
      | "Router"
      | "Media"
      | "Other"
      | "PaLM";
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: null;
  supported_parameters: (
    | "tools"
    | "temperature"
    | "top_p"
    | "top_k"
    | "min_p"
    | "top_a"
    | "frequency_penalty"
    | "presence_penalty"
    | "repetition_penalty"
    | "max_tokens"
    | "logit_bias"
    | "logprobs"
    | "top_logprobs"
    | "seed"
    | "response_format"
    | "structured_outputs"
    | "stop"
    | "parallel_tool_calls"
    | "include_reasoning"
    | "reasoning"
    | "web_search_options"
    | "verbosity"
  )[];
  default_parameters: {};
}

export class Service {
  baseURL: string;
  apiKey: string;

  constructor() {
    if (!OPEN_ROUTER_API_KEY) {
      throw new Error("Configuration error. OPEN_ROUTER_API_KEY is not set");
    }

    this.baseURL = "https://openrouter.ai/api/v1";
    this.apiKey = OPEN_ROUTER_API_KEY;
  }

  async generateText(props: {
    context: { role: "user" | "assistant" | "system"; content: string }[];
    model: string;
    fallbackModels?: string[];
    max_tokens?: number;
    reasoning?: boolean;
  }): Promise<{
    text: string;
    images?: { url?: string; b64_json?: string }[];
  }> {
    console.log("🚀 ~ open-router ~ generateText ~ props:", props);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: props.model,
        messages: props.context,
        stream: false,
        max_tokens: props.max_tokens,
        ...(props.reasoning && { reasoning: {} }),
      }),
    });

    const data = await response.json();

    console.log("🚀 ~ generateText ~ data:", data);

    if (data.error?.metadata?.raw.includes("temporarily rate-limited")) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve("");
        }, 5000);
      });

      return await this.generateText(props);
    }

    const message = data.choices[0].message;
    let text = "";
    let images: { url?: string; b64_json?: string }[] | undefined;

    // Check for images in message.images (Gemini format)
    if (message.images && Array.isArray(message.images)) {
      images = message.images.map((img: any) => {
        if (img.image_url?.url) {
          return { url: img.image_url.url };
        }
        return { url: img.url, b64_json: img.b64_json };
      });
    }

    // Check for images in attachments (alternative format)
    if (!images && message.attachments && Array.isArray(message.attachments)) {
      images = message.attachments
        .filter((att: any) => att.type === "image")
        .map((att: any) => ({ url: att.url, b64_json: att.b64_json }));
    }

    // If content is empty, try to extract answer from reasoning or reasoning_details
    if (!message.content && (message.reasoning || message.reasoning_details)) {
      let reasoningText = message.reasoning || "";

      // For APIs with reasoning_details (like OpenAI), find summary
      if (
        !reasoningText &&
        message.reasoning_details &&
        Array.isArray(message.reasoning_details)
      ) {
        const summaryItem = message.reasoning_details.find(
          (item: any) => item.summary || item.text,
        );
        if (summaryItem) {
          reasoningText = summaryItem.summary || summaryItem.text;
        }
      }

      // If we have reasoning text, return it as-is without pattern extraction
      if (reasoningText) {
        text = reasoningText.trim();
      }
    } else {
      text = message.content || message.reasoning || "";
    }

    return { text, images };
  }

  async getModels(): Promise<IOpenRouterModel[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();

    return data.data;
  }
}
