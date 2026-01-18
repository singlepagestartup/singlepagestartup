import { OPEN_ROUTER_API_KEY } from "@sps/shared-utils";
import type { IOpenRouterModel } from "./interface";

export type IOpenRouterMessageContent =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "auto" | "low" | "high" };
    }
  | {
      type: "file";
      file: {
        url?: string;
        file_data?: string;
        filename?: string;
        mime_type?: string;
      };
    }
  | { type: "file_url"; file_url: { url: string } };

export type IOpenRouterRequestMessage = {
  role: "user" | "assistant" | "system";
  content: string | IOpenRouterMessageContent[];
};

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

  async generate(props: {
    context: IOpenRouterRequestMessage[];
    model: string;
    fallbackModels?: string[];
    max_tokens?: number;
    reasoning?: boolean;
  }): Promise<
    | {
        text: string;
        images?: { url?: string; b64_json?: string }[];
      }
    | {
        error: any;
      }
  > {
    if (
      !props.context.some((m) => {
        if (typeof m.content !== "string") {
          return false;
        }

        return (
          m.content.includes(
            "without any additional text and symbols. Don't try to do the task itself, choose a model. Sort models by price for the requested item 'image' and select the cheapest model, that can solve the task. Check 'input_modalities' to have passed parameters and 'output_modalities' for requesting thing.",
          ) ||
          m.content.includes(
            "You need to detect what language the user is speaking, NOT coding language (JavaScript, C#) - human language (english,spanish,russian and etc). Answer with the language name only (Spanish).",
          )
        );
      })
    ) {
      console.log("🚀 ~ open-router ~ generate ~ props:", props);
    }

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

    if (data.error) {
      console.error(
        "❌ OpenRouter Error:",
        JSON.stringify(data.error, null, 2),
      );
      return data;
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
