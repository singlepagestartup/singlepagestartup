export const AGENT_MAX_DURATION_IN_SECONDS =
  parseInt(process.env.AGENT_MAX_DURATION_IN_SECONDS as string) || 5400;
export const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
export const OPEN_AI_TRANSCRIPTION_MODEL =
  process.env.OPEN_AI_TRANSCRIPTION_MODEL;
export const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
export const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
export const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
export const LLM_SERVICE_URL =
  process.env.LLM_SERVICE_URL || "http://localhost:8765";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
