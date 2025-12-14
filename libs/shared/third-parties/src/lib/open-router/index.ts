import { OPEN_ROUTER_API_KEY } from "@sps/shared-utils";

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
    max_tokens?: number;
  }): Promise<string> {
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
      }),
    });

    const data = await response.json();

    console.log("🚀 ~ generateText ~ data:", data);

    if (data.error?.metadata?.raw.includes("temporarily rate-limited")) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });

      return await this.generateText(props);
    }

    return data.choices[0].message.content;
  }
}
