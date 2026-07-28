/**
 * BDD Suite: Telegram published command catalog endpoint.
 *
 * Given: the startup Agent service owns the effective Telegram command registry.
 * When: the Telegram transport requests the published command catalog.
 * Then: the controller serializes that service result without owning command definitions.
 */

import { Handler } from "./commands";

describe("Given: a startup-overridden Telegram command registry", () => {
  /**
   * BDD Scenario
   * Given: Agent resolves the effective published commands.
   * When: the command catalog endpoint executes.
   * Then: it returns the exact service catalog.
   */
  it("returns commands from the injected Agent service", async () => {
    const commands = [
      {
        command: "learn",
        description: "Запомнить материал",
      },
    ];
    const service = {
      telegramPublishedCommandsFind: jest.fn().mockReturnValue(commands),
    } as any;
    const context = {
      json: jest.fn((value: unknown) => value),
    } as any;

    const result = await new Handler(service).execute(context);

    expect(service.telegramPublishedCommandsFind).toHaveBeenCalledTimes(1);
    expect(context.json).toHaveBeenCalledWith({ data: commands });
    expect(result).toEqual({ data: commands });
  });
});
