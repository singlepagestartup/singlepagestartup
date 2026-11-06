export const OPEN_ROUTER_ASSISTANT_MODEL = {
  id: "openai/gpt-6.1-sol",
  enabled: true,
  priority: 100,
  input_modalities: ["text", "image", "file"],
  output_modalities: ["text"],
  strengths: [
    "professional_work",
    "reasoning",
    "coding",
    "image_understanding",
  ],
  reasoning: { effort: "high", exclude: true },
} as const;

export const OPEN_ROUTER_MODEL_ROUTER_CONFIG = {
  version: "2026-10-13-gpt-6.1-sol-high",
  classes: {
    CHAT: [OPEN_ROUTER_ASSISTANT_MODEL],
    CODER: [OPEN_ROUTER_ASSISTANT_MODEL],
    VISION: [OPEN_ROUTER_ASSISTANT_MODEL],
    // OpenRouter advertises GPT 6.1 Sol as text/image/file input and text output.
    IMAGE: [],
  },
} as const;
