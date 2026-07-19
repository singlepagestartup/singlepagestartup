/**
 * BDD Suite: OpenRouter model metadata.
 *
 * Given: the chat UI receives live model metadata from OpenRouter.
 * When: models are transformed for the composer model selector.
 * Then: Thinking support and exact efforts are derived from OpenRouter reasoning metadata.
 */

const mockOpenRouterGetModels = jest.fn();

jest.mock("@sps/shared-third-parties", () => {
  return {
    openRouterReasoningEffortValues: [
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
      "minimal",
      "none",
    ],
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
   * Given: OpenRouter returns per-model reasoning efforts and one model without reasoning metadata.
   * When: the RBAC model list endpoint groups those models.
   * Then: each option exposes only the reasoning efforts accepted by that model.
   */
  it("When: models are listed Then: reasoning follows OpenRouter model metadata", async () => {
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
        reasoning: {
          mandatory: true,
          default_enabled: true,
          supported_efforts: ["high", "low", "none"],
          default_effort: "high",
        },
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
      {
        id: "openrouter/auto",
        name: "Auto Router",
        description: "",
        context_length: 2000000,
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
        supported_parameters: ["reasoning"],
      },
      {
        id: "google/gemini-all-efforts",
        name: "Gemini All Efforts",
        description: "",
        context_length: 1000000,
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
        supported_parameters: ["reasoning"],
        reasoning: {
          mandatory: false,
          supported_efforts: null,
        },
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
      reasoning: {
        defaultEffort: "high",
        defaultEnabled: true,
        mandatory: true,
        supportedEfforts: ["high", "low"],
        supportsMaxTokens: false,
      },
    });
    expect(
      models.find((model: any) => model.id === "openai/gpt-basic"),
    ).toMatchObject({
      supportedParameters: ["temperature"],
      supportsReasoning: false,
      reasoning: null,
    });
    expect(
      models.find((model: any) => model.id === "openrouter/auto"),
    ).toMatchObject({
      supportedParameters: ["reasoning"],
      supportsReasoning: false,
      reasoning: null,
    });
    expect(
      models.find((model: any) => model.id === "google/gemini-all-efforts"),
    ).toMatchObject({
      supportsReasoning: true,
      reasoning: {
        supportedEfforts: [
          "max",
          "xhigh",
          "high",
          "medium",
          "low",
          "minimal",
          "none",
        ],
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the OpenRouter catalog is public and the requesting profile is not connected to the chat.
   * When: the model list endpoint is requested.
   * Then: the catalog is returned without reading profile-to-chat relations.
   */
  it("When: an unrelated profile lists models Then: chat membership is not required", async () => {
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: "openai/gpt-public",
        name: "GPT Public",
        description: "",
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
      },
    ]);
    const service = createService();
    service.socialModule.profilesToChats.find.mockResolvedValue([]);
    const handler = new Handler(service as any);

    const response = (await handler.execute(createContext(), undefined)) as any;

    expect(service.socialModule.profilesToChats.find).not.toHaveBeenCalled();
    expect(response.data.groups[0].models).toEqual([
      expect.objectContaining({
        id: "openai/gpt-public",
      }),
    ]);
  });
});
