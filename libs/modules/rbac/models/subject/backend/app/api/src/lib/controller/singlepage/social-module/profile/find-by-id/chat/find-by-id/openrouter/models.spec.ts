/**
 * BDD Suite: OpenRouter model metadata.
 *
 * Given: the chat UI receives live model metadata from OpenRouter.
 * When: models are transformed for the composer model selector.
 * Then: Thinking support is derived from OpenRouter supported_parameters.
 */

const mockOpenRouterGetModels = jest.fn();

jest.mock("@sps/shared-third-parties", () => {
  return {
    OpenRouter: jest.fn(() => {
      return {
        getModels: mockOpenRouterGetModels,
      };
    }),
  };
});

import { Context } from "hono";
import { Handler } from "./models";

function createService() {
  return {
    socialModule: {
      profilesToChats: {
        find: jest.fn(async () => {
          return [
            {
              profileId: "profile-1",
              chatId: "chat-1",
            },
          ];
        }),
      },
    },
  };
}

function createContext(): Context {
  const params: Record<string, string> = {
    id: "subject-1",
    socialModuleProfileId: "profile-1",
    socialModuleChatId: "chat-1",
  };

  return {
    req: {
      param(name: string) {
        return params[name];
      },
    },
    json(payload: unknown) {
      return payload as Response;
    },
  } as unknown as Context;
}

describe("Given: OpenRouter model metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: OpenRouter returns one model with reasoning and one without it.
   * When: the RBAC model list endpoint groups those models.
   * Then: each option exposes supportsReasoning from supported_parameters.
   */
  it("When: models are listed Then: supportsReasoning follows OpenRouter metadata", async () => {
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: "openai/gpt-reasoning",
        name: "GPT Reasoning",
        description: "",
        context_length: 128000,
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
        supported_parameters: ["reasoning"],
      },
      {
        id: "openai/gpt-basic",
        name: "GPT Basic",
        description: "",
        context_length: 32000,
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
        supported_parameters: ["temperature"],
      },
    ]);

    const handler = new Handler(createService() as any);
    const response = (await handler.execute(createContext(), undefined)) as any;
    const models = response.data.groups.flatMap((group: any) => {
      return group.models;
    });

    expect(
      models.find((model: any) => model.id === "openai/gpt-reasoning"),
    ).toMatchObject({
      supportedParameters: ["reasoning"],
      supportsReasoning: true,
    });
    expect(
      models.find((model: any) => model.id === "openai/gpt-basic"),
    ).toMatchObject({
      supportedParameters: ["temperature"],
      supportsReasoning: false,
    });
  });
});
