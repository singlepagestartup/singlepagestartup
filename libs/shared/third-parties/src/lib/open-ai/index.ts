import { OPEN_AI_API_KEY } from "@sps/shared-utils";
import OpenAI from "openai";

export class Service {
  client: OpenAI;

  constructor() {
    if (!OPEN_AI_API_KEY) {
      throw new Error("Configuration error. OPEN_AI_API_KEY is not set");
    }

    this.client = new OpenAI({
      apiKey: OPEN_AI_API_KEY,
    });
  }

  async generateText(props: {
    context: { role: "user" | "assistant"; content: string }[];
  }) {
    const response = await this.client.responses.create({
      model: "gpt-4o-mini",
      input: props.context,
    });

    return response.output_text;
  }
}
