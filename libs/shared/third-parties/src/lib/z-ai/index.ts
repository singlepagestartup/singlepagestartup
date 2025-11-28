import { Z_AI_API_KEY } from "@sps/shared-utils";

export class Service {
  baseURL: string;
  apiKey: string;

  constructor() {
    if (!Z_AI_API_KEY) {
      throw new Error("Configuration error. Z_AI_API_KEY is not set");
    }

    this.baseURL = "https://api.z.ai/api/paas/v4/";
    this.apiKey = Z_AI_API_KEY;
  }

  async generateText(props: {
    context: { role: "user" | "assistant"; content: string }[];
  }) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4.5",
        messages: props.context,
      }),
    });

    const data = await response.json();

    console.log("🚀 ~ generateText ~ data:", data);

    return data.choices[0].message.content;
  }
}
