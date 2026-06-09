export function createLlmGatewayNetworkError(props: {
  operation: string;
  baseUrl: string;
  error: unknown;
  model?: string;
}) {
  const message =
    props.error instanceof Error && props.error.message
      ? ` ${props.error.message}`
      : "";
  const modelHint = props.model ? ` and model ${props.model} is available` : "";

  return new Error(
    `${props.operation} could not connect to LLM gateway at ${props.baseUrl}.${message} Ensure apps/llm is running${modelHint}. Run: npm run llm:dev.`,
  );
}
