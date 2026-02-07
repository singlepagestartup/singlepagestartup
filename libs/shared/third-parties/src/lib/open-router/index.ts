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

  private async fetchAsDataUrl(props: {
    url: string;
    fallbackMimeType: string;
  }): Promise<{ dataUrl: string; mimeType: string; filename?: string }> {
    const response = await fetch(props.url);

    if (!response.ok) {
      throw new Error(`OpenRouter file fetch failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType =
      response.headers.get("content-type") || props.fallbackMimeType;
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const filename = (() => {
      try {
        const parsed = new URL(props.url);
        const last = parsed.pathname.split("/").pop();
        return last || undefined;
      } catch (error) {
        return undefined;
      }
    })();

    return { dataUrl, mimeType, filename };
  }

  private async normalizeMessages(
    messages: IOpenRouterRequestMessage[],
  ): Promise<IOpenRouterRequestMessage[]> {
    return Promise.all(
      messages.map(async (message) => {
        if (typeof message.content === "string") {
          return message;
        }

        const normalizedContent = await Promise.all(
          message.content.map(async (part) => {
            if (part.type === "text") {
              return part;
            }

            if (part.type === "image_url") {
              const url = part.image_url.url;
              return {
                type: "image_url" as const,
                image_url: {
                  url,
                  ...(part.image_url.detail && {
                    detail: part.image_url.detail,
                  }),
                },
              };
            }

            if (part.type === "file_url") {
              const { dataUrl, mimeType, filename } = await this.fetchAsDataUrl(
                {
                  url: part.file_url.url,
                  fallbackMimeType: "application/octet-stream",
                },
              );

              return {
                type: "file" as const,
                file: {
                  file_data: dataUrl,
                  mime_type: mimeType,
                  filename: filename || "file",
                },
              };
            }

            if (part.type === "file") {
              if (part.file.file_data) {
                return part;
              }

              if (!part.file.url) {
                return part;
              }

              const { dataUrl, mimeType, filename } = await this.fetchAsDataUrl(
                {
                  url: part.file.url,
                  fallbackMimeType:
                    part.file.mime_type || "application/octet-stream",
                },
              );

              return {
                type: "file" as const,
                file: {
                  file_data: dataUrl,
                  mime_type: part.file.mime_type || mimeType,
                  filename: part.file.filename || filename || "file",
                },
              };
            }

            return part;
          }),
        );

        return {
          ...message,
          content: normalizedContent,
        };
      }),
    );
  }

  private stripNonTextContent(
    messages: IOpenRouterRequestMessage[],
  ): IOpenRouterRequestMessage[] {
    return messages.map((message) => {
      if (typeof message.content === "string") {
        return message;
      }

      const textParts = message.content.filter((part) => part.type === "text");

      if (!textParts.length) {
        return {
          ...message,
          content: "",
        };
      }

      return {
        ...message,
        content: textParts,
      };
    });
  }

  private async requestCompletion(props: {
    model: string;
    messages: IOpenRouterRequestMessage[];
    max_tokens?: number;
    reasoning?: boolean;
  }): Promise<any> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: props.model,
        messages: props.messages,
        stream: false,
        max_tokens: props.max_tokens,
        ...(props.reasoning && { reasoning: {} }),
      }),
    });

    return response.json();
  }

  private parseMessage(message: any): {
    text: string;
    images?: { url?: string; b64_json?: string }[];
  } {
    let text = "";
    let images: { url?: string; b64_json?: string }[] | undefined;

    if (message.images && Array.isArray(message.images)) {
      images = message.images.map((img: any) => {
        if (img.image_url?.url) {
          return { url: img.image_url.url };
        }
        return { url: img.url, b64_json: img.b64_json };
      });
    }

    if (!images && message.attachments && Array.isArray(message.attachments)) {
      images = message.attachments
        .filter((att: any) => att.type === "image")
        .map((att: any) => ({ url: att.url, b64_json: att.b64_json }));
    }

    if (Array.isArray(message.content)) {
      const textParts = message.content
        .filter((part: any) => part?.type === "text")
        .map((part: any) => part.text || "");
      text = textParts.join("");

      const contentImages = message.content
        .filter((part: any) => part?.type === "image_url")
        .map((part: any) => ({ url: part.image_url?.url }))
        .filter((img: any) => img.url);

      if (contentImages.length) {
        images = (images || []).concat(contentImages);
      }
    } else {
      text = message.content || "";
    }

    return { text, images };
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
    const hasNonTextContent = props.context.some(
      (message) => typeof message.content !== "string",
    );

    const normalizedMessages = await this.normalizeMessages(props.context);
    const data = await this.requestCompletion({
      model: props.model,
      messages: normalizedMessages,
      max_tokens: props.max_tokens,
      reasoning: props.reasoning,
    });

    if (data.error) {
      console.error(
        "❌ OpenRouter Error:",
        JSON.stringify(data.error, null, 2),
      );
      if (hasNonTextContent) {
        console.error(
          "↩️ OpenRouter Retry: stripping non-text content and retrying once.",
        );

        const strippedMessages = await this.normalizeMessages(
          this.stripNonTextContent(props.context),
        );

        const retryData = await this.requestCompletion({
          model: props.model,
          messages: strippedMessages,
          max_tokens: props.max_tokens,
          reasoning: props.reasoning,
        });

        if (retryData.error) {
          console.error(
            "❌ OpenRouter Retry Error:",
            JSON.stringify(retryData.error, null, 2),
          );
          return retryData;
        }

        return this.parseMessage(retryData.choices[0].message);
      }

      return data;
    }

    return this.parseMessage(data.choices[0].message);
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
