/**
 * BDD Suite: Telegram voice message processing.
 *
 * Given: Telegram voice notes arrive separately from text and ordinary attachments.
 * When: the Telegram adapter processes a voice update through mocked boundaries.
 * Then: it creates one traceable social message, stores audio metadata, and records transcription success or failure.
 */

import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import {
  extractTelegramAudioMessageData,
  extractTelegramVoiceMessageData,
  processTelegramVoiceMessage,
  TELEGRAM_VOICE_TRANSCRIPTION_ACTION_TYPE,
  TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY,
} from "./telegram-voice-message";

describe("Telegram voice message processing", () => {
  const voice = {
    duration: 7,
    fileId: "telegram-file-id",
    fileUniqueId: "telegram-file-unique-id",
    mimeType: "audio/ogg",
    sourceSystemId: "4242",
  };

  const createMessage = (props?: Partial<ISocialModuleMessage>) => {
    return {
      id: "message-id",
      createdAt: new Date("2026-05-15T00:00:00Z"),
      updatedAt: new Date("2026-05-15T00:00:00Z"),
      className: null,
      description: "",
      interaction: {},
      metadata: {},
      sourceSystemId: "4242",
      subtitle: null,
      title: null,
      variant: "default",
      ...props,
    } as ISocialModuleMessage;
  };

  /**
   * BDD Scenario
   * Given: a Telegram message contains voice metadata and a Telegram message id.
   * When: the adapter extracts voice processing input.
   * Then: the voice file identifiers and sourceSystemId are captured.
   */
  it("extracts voice metadata from a Telegram message", () => {
    expect(
      extractTelegramVoiceMessageData({
        message_id: 4242,
        voice: {
          duration: 7,
          file_id: "telegram-file-id",
          file_unique_id: "telegram-file-unique-id",
          mime_type: "audio/ogg",
        },
      }),
    ).toEqual(voice);
  });

  /**
   * BDD Scenario
   * Given: a Telegram message contains an uploaded audio file.
   * When: the adapter extracts audio processing input.
   * Then: the audio file identifiers and sourceSystemId are captured for transcription.
   */
  it("extracts uploaded audio metadata from a Telegram message", () => {
    expect(
      extractTelegramAudioMessageData({
        audio: {
          duration: 11,
          file_id: "telegram-audio-file-id",
          file_name: "meeting.mp3",
          file_unique_id: "telegram-audio-file-unique-id",
          mime_type: "audio/mpeg",
        },
        message_id: 4243,
      }),
    ).toEqual({
      duration: 11,
      fileId: "telegram-audio-file-id",
      fileUniqueId: "telegram-audio-file-unique-id",
      mimeType: "audio/mpeg",
      sourceSystemId: "4243",
    });
  });

  /**
   * BDD Scenario
   * Given: a Telegram document is an audio file by MIME type.
   * When: the adapter extracts audio processing input.
   * Then: the document is routed through the transcription flow.
   */
  it("extracts audio document metadata from a Telegram message", () => {
    expect(
      extractTelegramAudioMessageData({
        document: {
          file_id: "telegram-document-file-id",
          file_name: "voice-note.ogg",
          file_unique_id: "telegram-document-file-unique-id",
          mime_type: "audio/ogg",
        },
        message_id: 4244,
      }),
    ).toEqual({
      fileId: "telegram-document-file-id",
      fileUniqueId: "telegram-document-file-unique-id",
      mimeType: "audio/ogg",
      sourceSystemId: "4244",
    });
  });

  /**
   * BDD Scenario
   * Given: voice audio downloads, converts, and transcribes successfully.
   * When: the voice processor runs.
   * Then: it creates a processing message with converted audio and updates the same message with the transcript.
   */
  it("creates a processing message and completes it with transcript metadata", async () => {
    const originalFile = new File(["original"], "voice.ogg", {
      type: "audio/ogg",
    });
    const convertedFile = new File(["converted"], "voice.webm", {
      type: "audio/webm",
    });
    const processingMessage = createMessage({
      metadata: {
        existing: true,
      },
    });
    const completedMessage = createMessage({
      description: "hello from voice",
    });
    const createMessageMock = jest.fn().mockResolvedValue(processingMessage);
    const updateMessageMock = jest.fn().mockResolvedValue(completedMessage);
    const transcribeAudioMock = jest.fn().mockResolvedValue({
      metadata: {
        usage: {
          seconds: 7,
        },
      },
      text: "hello from voice",
    });

    const result = await processTelegramVoiceMessage({
      convertVoiceFile: jest.fn().mockResolvedValue(convertedFile),
      createMessage: createMessageMock,
      downloadVoiceFile: jest.fn().mockResolvedValue(originalFile),
      now: () => "2026-05-15T23:00:00.000Z",
      transcribeAudio: transcribeAudioMock,
      transcriptionModel: "gpt-4o-transcribe",
      updateMessage: updateMessageMock,
      voice,
    });

    expect(result).toBe(completedMessage);
    expect(createMessageMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: "",
        files: [convertedFile],
        sourceSystemId: "4242",
      }),
    });
    expect(
      (createMessageMock.mock.calls[0][0].data.metadata as any)[
        TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY
      ],
    ).toMatchObject({
      status: "processing",
      telegram: {
        fileId: "telegram-file-id",
        fileUniqueId: "telegram-file-unique-id",
      },
    });
    expect(transcribeAudioMock).toHaveBeenCalledWith({
      file: convertedFile,
      model: "gpt-4o-transcribe",
    });
    expect(updateMessageMock).toHaveBeenCalledWith({
      data: {
        description: "hello from voice",
        metadata: expect.objectContaining({
          existing: true,
          [TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY]: expect.objectContaining({
            agentTrigger: TELEGRAM_VOICE_TRANSCRIPTION_ACTION_TYPE,
            status: "completed",
          }),
        }),
      },
      message: processingMessage,
    });
  });

  /**
   * BDD Scenario
   * Given: voice audio downloads but conversion fails.
   * When: the voice processor handles the failure.
   * Then: it creates one failed social message with the original audio attached and does not call transcription.
   */
  it("records conversion failure without calling transcription", async () => {
    const originalFile = new File(["original"], "voice.ogg", {
      type: "audio/ogg",
    });
    const failedMessage = createMessage({
      metadata: {
        [TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY]: {
          status: "failed",
        },
      },
    });
    const createMessageMock = jest.fn().mockResolvedValue(failedMessage);
    const transcribeAudioMock = jest.fn();
    const updateMessageMock = jest.fn();

    const result = await processTelegramVoiceMessage({
      convertVoiceFile: jest.fn().mockRejectedValue(new Error("ffmpeg failed")),
      createMessage: createMessageMock,
      downloadVoiceFile: jest.fn().mockResolvedValue(originalFile),
      now: () => "2026-05-15T23:00:00.000Z",
      transcribeAudio: transcribeAudioMock,
      updateMessage: updateMessageMock,
      voice,
    });

    expect(result).toBe(failedMessage);
    expect(createMessageMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        files: [originalFile],
        sourceSystemId: "4242",
      }),
    });
    expect(
      (createMessageMock.mock.calls[0][0].data.metadata as any)[
        TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY
      ],
    ).toMatchObject({
      error: {
        category: "conversion",
        message: "ffmpeg failed",
      },
      status: "failed",
    });
    expect(transcribeAudioMock).not.toHaveBeenCalled();
    expect(updateMessageMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a duplicate Telegram update already has transcription metadata.
   * When: the voice processor runs again with the existing message.
   * Then: it returns the existing message without downloading, converting, or transcribing again.
   */
  it("skips duplicate voice updates that already have transcription metadata", async () => {
    const existingMessage = createMessage({
      metadata: {
        [TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY]: {
          status: "completed",
        },
      },
    });
    const downloadVoiceFileMock = jest.fn();
    const createMessageMock = jest.fn();

    const result = await processTelegramVoiceMessage({
      convertVoiceFile: jest.fn(),
      createMessage: createMessageMock,
      downloadVoiceFile: downloadVoiceFileMock,
      existingMessage,
      transcribeAudio: jest.fn(),
      updateMessage: jest.fn(),
      voice,
    });

    expect(result).toBe(existingMessage);
    expect(downloadVoiceFileMock).not.toHaveBeenCalled();
    expect(createMessageMock).not.toHaveBeenCalled();
  });
});
