/**
 * BDD Suite: Agent Telegram command registry.
 *
 * Given: Telegram transports commands as ordinary social messages.
 * When: Agent resolves their domain owner.
 * Then: system and AI commands are dispatched by an overrideable registry.
 */

import { type ITelegramCommandDefinitionOverride, Service } from "./index";

class StartupService extends Service {
  protected override getTelegramCommandDefinitions() {
    const overrides: ITelegramCommandDefinitionOverride[] = [
      {
        command: "/help",
        description: "Startup help",
        target: "artificial-intelligence",
      },
      {
        command: "/custom",
        description: "Custom startup command",
        target: "telegram-bot",
      },
    ];

    return this.mergeTelegramCommandDefinitions({
      base: super.getTelegramCommandDefinitions(),
      overrides,
    });
  }
}

describe("Agent Telegram command registry", () => {
  /**
   * BDD Scenario
   * Given: /learn and /knowledge are domain commands handled by an AI profile.
   * When: Agent resolves the command.
   * Then: the Telegram system profile does not own its semantics.
   */
  it("routes Knowledge commands to an artificial-intelligence social profile", () => {
    const service = Object.create(Service.prototype) as Service;

    const learn = (service as any).findTelegramCommandDefinition({
      description: "/learn Knowledge payload",
    });
    const knowledge = (service as any).findTelegramCommandDefinition({
      description: "/knowledge What is in the profile knowledge?",
    });

    expect(learn).toEqual(
      expect.objectContaining({
        definition: expect.objectContaining({
          command: "/learn",
          target: "artificial-intelligence",
        }),
        parsedCommand: {
          args: "Knowledge payload",
          command: "/learn",
        },
      }),
    );
    expect(knowledge).toEqual(
      expect.objectContaining({
        definition: expect.objectContaining({
          command: "/knowledge",
          target: "artificial-intelligence",
        }),
        parsedCommand: {
          args: "What is in the profile knowledge?",
          command: "/knowledge",
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a child project extends the startup Agent service.
   * When: it overrides an existing command and adds a new command.
   * Then: last definition wins without changing SinglePage or Telegram code.
   */
  it("allows startup definitions to replace and extend commands", () => {
    const service = Object.create(StartupService.prototype) as StartupService;

    const help = (service as any).findTelegramCommandDefinition({
      description: "/help",
    });
    const custom = (service as any).findTelegramCommandDefinition({
      description: "/custom value",
    });

    expect(help.definition.target).toBe("artificial-intelligence");
    expect(custom.definition.target).toBe("telegram-bot");
    expect(custom.parsedCommand.args).toBe("value");
  });

  /**
   * BDD Scenario
   * Given: Telegram needs the command menu published through Bot API.
   * When: Agent serializes its startup-overridden command registry.
   * Then: the catalog has Telegram-compatible names and descriptions.
   */
  it("publishes the startup-overridden command catalog", () => {
    const service = Object.create(StartupService.prototype) as StartupService;

    const result = service.telegramPublishedCommandsFind();

    expect(result).toEqual(
      expect.arrayContaining([
        {
          command: "help",
          description: "Startup help",
        },
        {
          command: "custom",
          description: "Custom startup command",
        },
        {
          command: "knowledge",
          description: "Использовать знания профиля",
        },
        {
          command: "learn",
          description: "Добавить сообщение в знания профиля",
        },
      ]),
    );
  });

  /**
   * BDD Scenario
   * Given: a child project only needs to rename or hide framework commands.
   * When: partial startup overrides are merged with SinglePage definitions.
   * Then: behavior handlers remain inherited and disabled commands disappear.
   */
  it("supports partial startup menu overrides", () => {
    class PartialStartupService extends Service {
      protected override getTelegramCommandDefinitions() {
        return this.mergeTelegramCommandDefinitions({
          base: super.getTelegramCommandDefinitions(),
          overrides: [
            {
              command: "/learn",
              description: "Запомнить материал",
            },
            {
              command: "/premium",
              enabled: false,
            },
          ],
        });
      }
    }

    const service = Object.create(
      PartialStartupService.prototype,
    ) as PartialStartupService;
    const result = service.telegramPublishedCommandsFind();

    expect(result).toContainEqual({
      command: "learn",
      description: "Запомнить материал",
    });
    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          command: "premium",
        }),
      ]),
    );
  });
});
