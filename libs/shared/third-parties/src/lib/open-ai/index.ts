import {
  AUDIO_TRANSCRIPTION_DEFAULT_MODEL,
  OPEN_AI_API_KEY,
  OPEN_AI_TRANSCRIPTION_MODEL,
} from "@sps/shared-utils";
import OpenAI, { type Uploadable } from "openai";

export interface TranscribeAudioProps {
  file: Uploadable;
  language?: string;
  model?: string;
  prompt?: string;
}

export interface TranscribeAudioResult {
  metadata: {
    model: string;
    usage?: unknown;
  };
  text: string;
}

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

  async transcribeAudio(
    props: TranscribeAudioProps,
  ): Promise<TranscribeAudioResult> {
    const model =
      props.model ||
      OPEN_AI_TRANSCRIPTION_MODEL ||
      AUDIO_TRANSCRIPTION_DEFAULT_MODEL;

    const response = await this.client.audio.transcriptions.create({
      file: props.file,
      language: props.language,
      model,
      prompt: props.prompt,
    });

    const text = response.text.trim();

    if (!text) {
      throw new Error("OpenAI transcription returned empty text");
    }

    return {
      metadata: {
        model,
        usage: response.usage,
      },
      text,
    };
  }
}
