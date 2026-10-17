/**
 * BDD Suite: OpenRouter model metadata.
 *
 * Given: the chat UI receives live model metadata from OpenRouter.
 * When: models are transformed for the composer model selector.
 * Then: only locally allowed models and reasoning efforts are exposed.
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
   * Given: OpenRouter returns GPT 6.1 Sol and other models with different reasoning defaults.
   * When: the RBAC model list endpoint groups those models.
   * Then: only GPT 6.1 Sol with high reasoning is available to the composer.
   */
  it("When: models are listed Then: the local single-model policy applies", async () => {
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: "openai/gpt-6.1-sol",
        name: "GPT 6.1 Sol",
        description: "",
        context_length: 128000,
        architecture: {
          input_modalities: ["text", "image", "file"],
          output_modalities: ["text"],
        },
        supported_parameters: ["reasoning"],
        reasoning: {
          mandatory: true,
          default_enabled: true,
          supported_efforts: ["xhigh", "high", "medium", "low"],
          default_effort: "medium",
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

    expect(response.data.auto.id).toBe("auto");
    expect(response.data.groups.map((group: any) => group.id)).toEqual([
      "vision_file",
    ]);
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-6.1-sol",
      inputModalities: ["text", "image", "file"],
      outputModalities: ["text"],
      supportedParameters: ["reasoning"],
      supportsReasoning: true,
      reasoning: {
        defaultEffort: "high",
        defaultEnabled: true,
        mandatory: true,
        supportedEfforts: ["high"],
        supportsMaxTokens: false,
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
        id: "openai/gpt-6.1-sol",
        name: "GPT 6.1 Sol",
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
        id: "openai/gpt-6.1-sol",
      }),
    ]);
  });

  it("returns an empty catalogue when the provider does not list the allowed model", async () => {
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: "openrouter/auto",
        name: "Auto Router",
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
      },
    ]);
    const handler = new Handler(createService() as any);
    const response = (await handler.execute(createContext(), undefined)) as any;
    expect(response.data.groups).toEqual([]);
  });
});
