/**
 * BDD Suite: RBAC audio transcription service.
 *
 * Given: social messages can have audio files attached through file-storage.
 * When: RBAC creates an audio message.
 * Then: RBAC owns OpenAI transcription, message updates, and completion actions.
 */

const mockMessageUpdate = jest.fn();
const mockActionCreate = jest.fn();
const mockThreadFindById = jest.fn();
const mockThreadUpdate = jest.fn();
const mockTranscribeAudio = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    AUDIO_TRANSCRIPTION_ACTION_TYPE: "audio_transcription_completed",
    AUDIO_TRANSCRIPTION_DEFAULT_MODEL: "gpt-4o-transcribe",
    AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY: "telegramVoiceTranscription",
    AUDIO_TRANSCRIPTION_MAX_BYTES: 25 * 1024 * 1024,
    AUDIO_TRANSCRIPTION_METADATA_KEY: "audioTranscription",
    OPEN_AI_TRANSCRIPTION_MODEL: "gpt-4o-transcribe",
    RBAC_JWT_SECRET: "rbac-jwt-secret",
    RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("hono/jwt", () => {
  return {
    sign: jest.fn().mockResolvedValue("signed-jwt"),
  };
});

jest.mock("@sps/shared-third-parties", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
      };
    }),
  };
});

jest.mock("@sps/social/models/message/sdk/server", () => {
  return {
    api: {
      update: (...args: unknown[]) => mockMessageUpdate(...args),
    },
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      socialModuleProfileFindByIdChatFindByIdActionCreate: (
        ...args: unknown[]
      ) => mockActionCreate(...args),
      socialModuleChatFindByIdThreadUpdate: (...args: unknown[]) =>
        mockThreadUpdate(...args),
    },
  };
});

jest.mock("@sps/social/models/thread/sdk/server", () => {
  return {
    api: {
      findById: (...args: unknown[]) => mockThreadFindById(...args),
    },
  };
});

import {
  AudioTranscriptionService,
  shouldSkipOrdinaryNotificationForAudioTranscription,
} from "./audio-transcription";
import {
  AUDIO_TRANSCRIPTION_ACTION_TYPE,
  AUDIO_TRANSCRIPTION_METADATA_KEY,
} from "@sps/shared-utils";

const flushBackgroundTasks = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("Given: RBAC audio transcription service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessageUpdate.mockImplementation(async ({ data }) => data);
    mockThreadFindById.mockResolvedValue({
      id: "thread-1",
      sourceSystemId: "123",
      title: "Telegram topic 123",
    });
    mockTranscribeAudio.mockResolvedValue({
      metadata: {
        model: "gpt-4o-transcribe",
      },
      text: "transcribed audio",
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode("audio").buffer,
      headers: {
        get: () => "audio/ogg",
      },
      ok: true,
    });
  });

  /**
   * BDD Scenario
   * Given: a social message has an audio file attachment.
   * When: RBAC prepares transcription.
   * Then: it writes processing metadata, transcribes the file, and creates a generic completed action.
   */
  it("When: an audio attachment is prepared Then: OpenAI transcription is handled in RBAC", async () => {
    const service = new AudioTranscriptionService();
    const result = await service.prepareAndRun({
      fileStorageModuleFiles: [
        {
          id: "file-1",
          file: "https://files.example.com/voice.ogg",
          mimeType: "audio/ogg",
          size: 1024,
        } as any,
      ],
      now: () => "2026-05-17T00:00:00.000Z",
      rbacModuleSubjectId: "subject-1",
      socialModuleChatId: "chat-1",
      socialModuleMessage: {
        id: "message-1",
        description: "",
        metadata: {},
      } as any,
      socialModuleProfileId: "profile-1",
      socialModuleThreadId: "thread-1",
    });

    expect(
      (result.metadata as Record<string, unknown>)[
        AUDIO_TRANSCRIPTION_METADATA_KEY
      ],
    ).toMatchObject({
      status: "processing",
    });
    expect(
      shouldSkipOrdinaryNotificationForAudioTranscription(result as any),
    ).toBe(true);

    await flushBackgroundTasks();

    expect(mockTranscribeAudio).toHaveBeenCalledWith({
      file: expect.any(File),
      model: "gpt-4o-transcribe",
    });
    expect(mockMessageUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: "transcribed audio",
          metadata: expect.objectContaining({
            [AUDIO_TRANSCRIPTION_METADATA_KEY]: expect.objectContaining({
              agentTrigger: AUDIO_TRANSCRIPTION_ACTION_TYPE,
              status: "completed",
            }),
          }),
        }),
      }),
    );
    expect(mockActionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          headers: {
            Authorization: "Bearer signed-jwt",
          },
        },
        params: {
          socialModuleThreadId: "thread-1",
        },
        data: {
          payload: expect.objectContaining({
            type: AUDIO_TRANSCRIPTION_ACTION_TYPE,
          }),
        },
      }),
    );
    expect(mockThreadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "transcribed audio",
        },
        options: {
          headers: {
            Authorization: "Bearer signed-jwt",
          },
        },
        socialModuleThreadId: "thread-1",
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: Telegram stores an Ogg voice note with the .oga extension.
   * When: RBAC sends the file to OpenAI for transcription.
   * Then: it normalizes the upload name to .ogg while preserving the stored file.
   */
  it("When: an OGA voice attachment is transcribed Then: OpenAI receives an OGG filename", async () => {
    const service = new AudioTranscriptionService();

    await service.prepareAndRun({
      fileStorageModuleFiles: [
        {
          id: "file-1",
          file: "https://files.example.com/voice.oga",
          mimeType: "audio/ogg",
          size: 1024,
        } as any,
      ],
      now: () => "2026-05-17T00:00:00.000Z",
      rbacModuleSubjectId: "subject-1",
      socialModuleChatId: "chat-1",
      socialModuleMessage: {
        id: "message-1",
        description: "",
        metadata: {},
      } as any,
      socialModuleProfileId: "profile-1",
      socialModuleThreadId: "thread-1",
    });

    await flushBackgroundTasks();

    const upload = mockTranscribeAudio.mock.calls[0][0] as { file: File };

    expect(upload.file.name).toBe("voice.ogg");
    expect(upload.file.type).toBe("audio/ogg");
  });

  /**
   * BDD Scenario
   * Given: OpenAI transcription fails.
   * When: RBAC handles the background task.
   * Then: it logs the API-side error and stores only safe failed metadata.
   */
  it("When: OpenAI transcription fails Then: raw error text is not stored as message text", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockTranscribeAudio.mockRejectedValueOnce(
      new Error("Configuration error. OPEN_AI_API_KEY is not set"),
    );
    const service = new AudioTranscriptionService();

    await service.prepareAndRun({
      fileStorageModuleFiles: [
        {
          id: "file-1",
          file: "https://files.example.com/voice.ogg",
          mimeType: "audio/ogg",
          size: 1024,
        } as any,
      ],
      now: () => "2026-05-17T00:00:00.000Z",
      rbacModuleSubjectId: "subject-1",
      socialModuleChatId: "chat-1",
      socialModuleMessage: {
        id: "message-1",
        description: "",
        metadata: {},
      } as any,
      socialModuleProfileId: "profile-1",
      socialModuleThreadId: "thread-1",
    });

    await flushBackgroundTasks();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Audio transcription failed",
      expect.objectContaining({
        message: "Configuration error. OPEN_AI_API_KEY is not set",
      }),
    );
    expect(mockMessageUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: "",
          metadata: expect.objectContaining({
            [AUDIO_TRANSCRIPTION_METADATA_KEY]: expect.objectContaining({
              error: {
                category: "transcription",
              },
              status: "failed",
            }),
          }),
        }),
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
