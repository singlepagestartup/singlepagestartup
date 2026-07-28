/**
 * BDD Suite: rbac.subject AI service composition.
 *
 * Given: profile MCP and AI behavior belongs to the main rbac.subject service.
 * When: controllers call the public domain methods or startup overrides them.
 * Then: execution is delegated through one replaceable SPS service boundary.
 */

import { Service } from "../../index";
import { Service as StartupService } from "../../../startup";
import type {
  IAiExecutionActionReporter,
  IProfileMcpCatalogSession,
  ISocialProfileAiToolLoopResult,
} from "../../public-contract";

describe("Given: rbac.subject profile AI service composition", () => {
  /**
   * BDD Scenario
   * Given: domain implementations are supplied by the main service factories.
   * When: its public MCP, tool-loop, action, and billing methods are called.
   * Then: each operation crosses the main service boundary exactly once.
   */
  it("When: profile AI operations run Then: the main service composes every domain service", async () => {
    const mcpSession: IProfileMcpCatalogSession = {
      catalog: {
        supported: [],
        connected: [],
        stale: [],
      },
      callTool: jest.fn(),
      close: jest.fn(),
    };
    const toolLoopResult: ISocialProfileAiToolLoopResult = {
      finalText: "done",
      selectedModelId: "openai/gpt-5.2",
      context: [],
      trace: {
        enabled: true,
        stepCount: 0,
        exposedToolNames: [],
        calls: [],
        stopReason: "final_text",
        durationMs: 1,
      },
    };
    const actionReporter: IAiExecutionActionReporter = {
      handle: jest.fn(),
    };
    const openMcpCatalog = jest.fn().mockResolvedValue(mcpSession);
    const runToolLoop = jest.fn().mockResolvedValue(toolLoopResult);
    const createActionReporter = jest.fn().mockReturnValue(actionReporter);
    const service = Object.create(Service.prototype) as Service;

    Object.defineProperties(service, {
      getSocialModuleProfileMcpCatalogService: {
        value: () => ({ open: openMcpCatalog }),
      },
      getSocialModuleProfileAiToolLoopService: {
        value: () => ({ run: runToolLoop }),
      },
      createSocialModuleProfileAiExecutionActionReporter: {
        value: createActionReporter,
      },
    });

    await expect(
      service.socialModuleProfileMcpCatalogOpen({
        configuredServerIds: ["singlepagestartup"],
        rbacSubjectAuthenticationJwt: "jwt",
      }),
    ).resolves.toBe(mcpSession);
    await expect(
      service.socialModuleProfileAiToolLoopRun({
        context: [],
        modelCandidateIds: ["openai/gpt-5.2"],
        tools: [],
        generate: jest.fn(),
      }),
    ).resolves.toBe(toolLoopResult);
    expect(
      service.socialModuleProfileAiExecutionActionReporterCreate({
        chatId: "chat-id",
        threadId: "thread-id",
        triggerMessageId: "message-id",
        replySocialProfileId: "profile-id",
        secretKey: "secret",
      }),
    ).toBe(actionReporter);
    expect(
      service.billingOpenRouterSummarize({
        calls: [],
        selectedModelId: null,
      }),
    ).toEqual(
      expect.objectContaining({
        prechargeTokens: 1,
        exactTokens: 0,
        deltaTokens: -1,
      }),
    );

    expect(openMcpCatalog).toHaveBeenCalledTimes(1);
    expect(runToolLoop).toHaveBeenCalledTimes(1);
    expect(createActionReporter).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a startup project extends the generated rbac.subject service.
   * When: it overrides a public profile MCP method.
   * Then: callers receive startup behavior without changing a controller.
   */
  it("When: startup overrides profile MCP behavior Then: the override is the controller-facing implementation", async () => {
    const startupSession: IProfileMcpCatalogSession = {
      catalog: {
        supported: [],
        connected: [],
        stale: ["startup-override"],
      },
      callTool: jest.fn(),
      close: jest.fn(),
    };

    class CustomerSubjectService extends StartupService {
      override async socialModuleProfileMcpCatalogOpen(
        _props: Parameters<
          StartupService["socialModuleProfileMcpCatalogOpen"]
        >[0],
      ): Promise<IProfileMcpCatalogSession> {
        return startupSession;
      }
    }

    const service = Object.create(
      CustomerSubjectService.prototype,
    ) as CustomerSubjectService;

    await expect(
      service.socialModuleProfileMcpCatalogOpen({
        configuredServerIds: [],
        rbacSubjectAuthenticationJwt: "startup-jwt",
      }),
    ).resolves.toBe(startupSession);
  });
});
