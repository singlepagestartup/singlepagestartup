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
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
  };
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
