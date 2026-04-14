export interface IOpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost?: number;
  cost_details?: {
    upstream_inference_cost?: number;
  };
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_write_tokens?: number;
    audio_tokens?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
    audio_tokens?: number;
  };
}

export interface IOpenRouterPricing {
  prompt: string;
  completion: string;
  request: string;
  image: string;
  web_search: string;
  internal_reasoning: string;
  input_cache_read: string;
  input_cache_write?: string;
}

export interface IOpenRouterBillingBreakdown {
  promptUsd: number;
  completionUsd: number;
  requestUsd: number;
  imageUsd: number;
  webSearchUsd: number;
  reasoningUsd: number;
  cacheReadUsd: number;
  cacheWriteUsd: number;
  totalUsd: number;
  inputImageCount: number;
  outputImageCount: number;
}

export interface IOpenRouterBilling {
  requestModelId: string;
  responseModelId: string;
  usage: IOpenRouterUsage | null;
  pricing: IOpenRouterPricing | null;
  usageCostCredits: number | null;
  upstreamInferenceCostCredits: number | null;
  breakdown: IOpenRouterBillingBreakdown;
  totalUsd: number;
}

export interface IOpenRouterGeneratedImage {
  url?: string;
  b64_json?: string;
}

export interface IOpenRouterGenerationSuccess {
  text: string;
  images?: IOpenRouterGeneratedImage[];
  billing: IOpenRouterBilling;
}

export interface IOpenRouterGenerationError {
  error: any;
  billing: IOpenRouterBilling | null;
}

export type IOpenRouterGenerateResult =
  | IOpenRouterGenerationSuccess
  | IOpenRouterGenerationError;

export interface IOpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: number | string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: ("text" | "image" | "file")[];
    output_modalities: ("text" | "image" | "file")[];
    tokenizer:
      | "GPT"
      | "Claude"
      | "Gemini"
      | "Grok"
      | "Cohere"
      | "Nova"
      | "Qwen"
      | "Yi"
      | "DeepSeek"
      | "Mistral"
      | "Llama2"
      | "Llama3"
      | "Llama4"
      | "RWKV"
      | "Qwen3"
      | "Router"
      | "Media"
      | "Other"
      | "PaLM";
    instruct_type: string | null;
  };
  pricing: IOpenRouterPricing;
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: null;
  supported_parameters: (
    | "tools"
    | "temperature"
    | "top_p"
    | "top_k"
    | "min_p"
    | "top_a"
    | "frequency_penalty"
    | "presence_penalty"
    | "repetition_penalty"
    | "max_tokens"
    | "logit_bias"
    | "logprobs"
    | "top_logprobs"
    | "seed"
    | "response_format"
    | "structured_outputs"
    | "stop"
    | "parallel_tool_calls"
    | "include_reasoning"
    | "reasoning"
    | "web_search_options"
    | "verbosity"
  )[];
  default_parameters: {};
}
