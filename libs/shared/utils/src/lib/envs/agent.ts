export const AGENT_MAX_DURATION_IN_SECONDS =
  parseInt(process.env.AGENT_MAX_DURATION_IN_SECONDS as string) || 5400;
export const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
