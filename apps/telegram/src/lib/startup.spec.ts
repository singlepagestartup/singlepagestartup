/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram startup synchronization.
 *
 * Given: Telegram depends on internal API and external Telegram API services.
 * When: startup synchronization encounters a temporary network failure.
 * Then: it retries safely without exposing credentials in operational logs.
 */

import {
  runTelegramStartupWithRetry,
  summarizeTelegramStartupError,
} from "./startup";

describe("Given: a temporarily unavailable Telegram startup dependency", () => {
  /**
   * BDD Scenario
   * Given: command or webhook synchronization fails twice and then succeeds.
   * When: startup synchronization runs with retry enabled.
   * Then: it applies bounded exponential backoff and completes automatically.
   */
  it("When: synchronization recovers Then: startup completes without a restart", async () => {
    const synchronize = jest
      .fn()
      .mockRejectedValueOnce(new Error("API is starting"))
      .mockRejectedValueOnce(new Error("Telegram API is unavailable"))
      .mockResolvedValue(true);
    const sleep = jest.fn().mockResolvedValue(undefined);
    const onFailure = jest.fn();
    const onSuccess = jest.fn();

    await expect(
      runTelegramStartupWithRetry({
        synchronize,
        sleep,
        onFailure,
        onSuccess,
        initialRetryDelayMs: 100,
        maximumRetryDelayMs: 150,
      }),
    ).resolves.toBeUndefined();

    expect(synchronize).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 150);
    expect(onFailure).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("Given: a Telegram transport error containing a bot token", () => {
  /**
   * BDD Scenario
   * Given: the transport error contains the credential-bearing Telegram URL.
   * When: the error is prepared for startup logging.
   * Then: only safe diagnostic fields remain and the token is redacted.
   */
  it("When: the error is summarized Then: credentials are not logged", () => {
    const token = "1234567890:AAExampleTokenValueForRedactionOnly_12345";
    const summary = summarizeTelegramStartupError({
      name: "HttpError",
      message: `Unable to connect to https://api.telegram.org/bot${token}/setMyCommands`,
      path: `https://api.telegram.org/bot${token}/setMyCommands`,
      error: {
        code: "ConnectionRefused",
      },
    });

    expect(summary).toEqual({
      name: "HttpError",
      message:
        "Unable to connect to https://api.telegram.org/bot[redacted]/setMyCommands",
      code: "ConnectionRefused",
    });
    expect(JSON.stringify(summary)).not.toContain(token);
    expect(summary).not.toHaveProperty("path");
  });
});
