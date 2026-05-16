/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram file normalization.
 *
 * Given: Telegram returns transport-specific audio files.
 * When: the adapter downloads files for RBAC ingestion.
 * Then: audio files are converted to MP3 before being saved by file-storage.
 */

const mockBlobifyFiles = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    TELEGRAM_SERVICE_BOT_TOKEN: "telegram-token",
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    blobifyFiles: (...args: unknown[]) => mockBlobifyFiles(...args),
  };
});

import { TelegarmBot } from "./telegram-bot";

describe("Given: Telegram file normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: Telegram returns a voice note as Ogg audio.
   * When: the adapter prepares files for RBAC message create.
   * Then: it converts the audio file to MP3 before file-storage receives it.
   */
  it("When: Telegram audio is downloaded Then: it returns an MP3 file", async () => {
    const sourceFile = new File(["ogg"], "voice.oga", {
      type: "audio/ogg",
    });
    const mp3File = new File(["mp3"], "voice.mp3", {
      type: "audio/mpeg",
    });
    mockBlobifyFiles.mockResolvedValue([sourceFile]);
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.convertTelegramAudioFileToMp3 = jest.fn().mockResolvedValue(mp3File);

    const files = await bot.buildTelegramFiles({
      attachments: [
        {
          fileId: "telegram-file-id",
          mimeType: "audio/ogg",
          title: "telegram-voice-file",
        },
      ],
      ctx: {
        api: {
          getFile: jest.fn().mockResolvedValue({
            file_path: "voice/file.oga",
          }),
        },
      },
    });

    expect(mockBlobifyFiles).toHaveBeenCalledWith({
      files: [
        expect.objectContaining({
          extension: "oga",
          title: "telegram-voice-file",
          type: "audio/ogg",
        }),
      ],
    });
    expect(bot.convertTelegramAudioFileToMp3).toHaveBeenCalledWith({
      file: sourceFile,
      title: "telegram-voice-file",
    });
    expect(files).toEqual([mp3File]);
  });

  /**
   * BDD Scenario
   * Given: Telegram returns a non-audio attachment.
   * When: the adapter prepares files for RBAC message create.
   * Then: it keeps the original file without MP3 conversion.
   */
  it("When: Telegram image is downloaded Then: it keeps the original file", async () => {
    const sourceFile = new File(["image"], "photo.jpg", {
      type: "image/jpeg",
    });
    mockBlobifyFiles.mockResolvedValue([sourceFile]);
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.convertTelegramAudioFileToMp3 = jest.fn();

    const files = await bot.buildTelegramFiles({
      attachments: [
        {
          fileId: "telegram-file-id",
          mimeType: "image/jpeg",
          title: "telegram-photo",
        },
      ],
      ctx: {
        api: {
          getFile: jest.fn().mockResolvedValue({
            file_path: "photo/file.jpg",
          }),
        },
      },
    });

    expect(bot.convertTelegramAudioFileToMp3).not.toHaveBeenCalled();
    expect(files).toEqual([sourceFile]);
  });
});
