/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram audio message extraction.
 *
 * Given: Telegram voice notes and uploaded audio files arrive through transport updates.
 * When: the Telegram adapter extracts message data.
 * Then: it captures only Telegram-specific file identifiers for RBAC ingestion.
 */

import {
  extractTelegramAudioMessageData,
  extractTelegramVoiceMessageData,
} from "./telegram-voice-message";

describe("Given: Telegram audio message extraction", () => {
  /**
   * BDD Scenario
   * Given: a Telegram message contains voice metadata and a Telegram message id.
   * When: the adapter extracts voice processing input.
   * Then: the voice file identifiers and sourceSystemId are captured without OpenAI state.
   */
  it("When: voice metadata is present Then: it extracts Telegram file identifiers", () => {
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
    ).toEqual({
      duration: 7,
      fileId: "telegram-file-id",
      fileUniqueId: "telegram-file-unique-id",
      mimeType: "audio/ogg",
      sourceSystemId: "4242",
    });
  });

  /**
   * BDD Scenario
   * Given: a Telegram message contains an uploaded audio file.
   * When: the adapter extracts audio processing input.
   * Then: the audio file identifiers and sourceSystemId are captured for RBAC ingestion.
   */
  it("When: uploaded audio metadata is present Then: it extracts Telegram file identifiers", () => {
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
   * Then: the document is routed into RBAC as an audio attachment.
   */
  it("When: document is audio Then: it extracts document file identifiers", () => {
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
});
