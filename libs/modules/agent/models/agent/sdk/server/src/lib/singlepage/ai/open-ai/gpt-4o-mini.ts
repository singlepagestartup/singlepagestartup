import { serverHost, route } from "@sps/agent/models/agent/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    description: string;
  };
}

export type IResult = {
  id: string;
  object: string;
  created_at: number;
  status: string;
  background: boolean;
  error: string | null;
  incomplete_details: string | null;
  instructions: string | null;
  max_output_tokens: number | null;
  max_tool_calls: number | null;
  model: string;
  output: {
    id: string;
    type: string;
    status: string;
    content: {
      type: string;
      annotations: string[];
      logprobs: string[];
      text: string;
    };
    role: string;
  };
  parallel_tool_calls: boolean;
  previous_response_id: string | null;
  reasoning: {
    effort: string | null;
    summary: string | null;
  };
  service_tier: string;
  store: boolean;
  temperature: number;
  text: {
    format: {
      type: "text";
    };
  };
  tool_choice: "auto";
  tools: [];
  top_logprobs: number;
  top_p: number;
  truncation: string;
  usage: {
    input_tokens: 18;
    input_tokens_details: {
      cached_tokens: 0;
    };
    output_tokens: 33;
    output_tokens_details: {
      reasoning_tokens: 0;
    };
    total_tokens: 51;
  };
  user: string | null;
  metadata: Record<string, any>;
  output_text: string;
};

export async function action(props: IProps): Promise<IResult> {
  const { params, options, host = serverHost, data } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/ai/open-ai/gpt-4o-mini?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
