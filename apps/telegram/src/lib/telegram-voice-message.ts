import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import {
  TELEGRAM_VOICE_TRANSCRIPTION_ACTION_TYPE,
  TELEGRAM_VOICE_TRANSCRIPTION_DEFAULT_MODEL,
  TELEGRAM_VOICE_TRANSCRIPTION_MAX_BYTES,
  TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY,
} from "@sps/shared-utils";

export {
  TELEGRAM_VOICE_TRANSCRIPTION_ACTION_TYPE,
  TELEGRAM_VOICE_TRANSCRIPTION_DEFAULT_MODEL,
  TELEGRAM_VOICE_TRANSCRIPTION_MAX_BYTES,
  TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY,
};

export interface TelegramVoiceMessageData {
  duration?: number;
  fileId: string;
  fileUniqueId?: string;
  mimeType?: string;
  sourceSystemId: string;
}

export interface TelegramVoiceTranscriptionResult {
  metadata?: unknown;
  text: string;
}

export interface ProcessTelegramVoiceMessageProps {
  createMessage: (props: {
    data: {
      description: string;
      files?: File[];
      metadata: Record<string, unknown>;
      sourceSystemId: string;
    };
  }) => Promise<ISocialModuleMessage>;
  description?: string;
  downloadVoiceFile: () => Promise<File>;
  existingMessage?: ISocialModuleMessage;
  convertVoiceFile: (props: {
    file: File;
    voice: TelegramVoiceMessageData;
  }) => Promise<File>;
  now?: () => string;
  transcribeAudio: (props: {
    file: File;
    model: string;
  }) => Promise<TelegramVoiceTranscriptionResult>;
  transcriptionModel?: string;
  updateMessage: (props: {
    data: {
      description?: string;
      metadata: Record<string, unknown>;
    };
    message: ISocialModuleMessage;
  }) => Promise<ISocialModuleMessage | ISocialModuleMessage[] | undefined>;
  voice: TelegramVoiceMessageData;
}

export class TelegramVoiceTranscriptionError extends Error {
  category: "download" | "conversion" | "transcription" | "validation";

  constructor(props: {
    category: "download" | "conversion" | "transcription" | "validation";
    message: string;
  }) {
    super(props.message);
    this.category = props.category;
  }
}

export function extractTelegramVoiceMessageData(
  message: any,
): TelegramVoiceMessageData | undefined {
  if (!message?.voice?.file_id) {
    return;
  }

  const sourceSystemId = message?.message_id?.toString();

  if (!sourceSystemId) {
    return;
  }

  return {
    duration: message.voice.duration,
    fileId: message.voice.file_id,
    fileUniqueId: message.voice.file_unique_id,
    mimeType: message.voice.mime_type,
    sourceSystemId,
  };
}

export function getTelegramVoiceTranscriptionStatus(
  message?: Pick<ISocialModuleMessage, "metadata">,
) {
  const metadata = message?.metadata;

  if (!metadata || typeof metadata !== "object") {
    return;
  }

  const value = metadata[TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY];

  if (!value || typeof value !== "object" || !("status" in value)) {
    return;
  }

  return String((value as { status?: unknown }).status || "");
}

export function hasTelegramVoiceTranscriptionMetadata(
  message?: Pick<ISocialModuleMessage, "metadata">,
) {
  return Boolean(getTelegramVoiceTranscriptionStatus(message));
}

export function assertTelegramVoiceTranscriptionSize(props: { file: File }) {
  if (props.file.size <= TELEGRAM_VOICE_TRANSCRIPTION_MAX_BYTES) {
    return;
  }

  throw new TelegramVoiceTranscriptionError({
    category: "validation",
    message: `Audio file exceeds OpenAI transcription limit: ${props.file.size} bytes`,
  });
}

export async function convertTelegramVoiceFileToWebm(props: {
  file: File;
  voice: TelegramVoiceMessageData;
}): Promise<File> {
  const tempDirectory = await mkdtemp(join(tmpdir(), "sps-telegram-voice-"));
  const inputPath = join(tempDirectory, "voice.ogg");
  const outputPath = join(tempDirectory, "voice.webm");

  try {
    const inputBuffer = Buffer.from(await props.file.arrayBuffer());
    await writeFile(inputPath, inputBuffer);

    await runFfmpeg([
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-c:a",
      "libopus",
      "-vn",
      outputPath,
    ]);

    const outputBuffer = await readFile(outputPath);

    return new File(
      [outputBuffer],
      `telegram-voice-${props.voice.fileUniqueId || props.voice.sourceSystemId}.webm`,
      {
        type: "audio/webm",
      },
    );
  } catch (error) {
    throw normalizeTelegramVoiceError({
      category: "conversion",
      error,
    });
  } finally {
    await rm(tempDirectory, {
      force: true,
      recursive: true,
    });
  }
}

export async function processTelegramVoiceMessage(
  props: ProcessTelegramVoiceMessageProps,
): Promise<ISocialModuleMessage | undefined> {
  const now = props.now || (() => new Date().toISOString());
  const model =
    props.transcriptionModel || TELEGRAM_VOICE_TRANSCRIPTION_DEFAULT_MODEL;

  if (hasTelegramVoiceTranscriptionMetadata(props.existingMessage)) {
    return props.existingMessage;
  }

  let originalFile: File | undefined;

  try {
    originalFile = await props.downloadVoiceFile();
  } catch (error) {
    return props.createMessage({
      data: {
        description: props.description || "",
        metadata: buildTelegramVoiceTranscriptionMetadata({
          error: normalizeTelegramVoiceError({
            category: "download",
            error,
          }),
          model,
          now: now(),
          status: "failed",
          voice: props.voice,
        }),
        sourceSystemId: props.voice.sourceSystemId,
      },
    });
  }

  let transcriptionFile: File;

  try {
    transcriptionFile = await props.convertVoiceFile({
      file: originalFile,
      voice: props.voice,
    });

    assertTelegramVoiceTranscriptionSize({
      file: transcriptionFile,
    });
  } catch (error) {
    return props.createMessage({
      data: {
        description: props.description || "",
        files: [originalFile],
        metadata: buildTelegramVoiceTranscriptionMetadata({
          error: normalizeTelegramVoiceError({
            category:
              error instanceof TelegramVoiceTranscriptionError
                ? error.category
                : "conversion",
            error,
          }),
          model,
          now: now(),
          originalFile,
          status: "failed",
          voice: props.voice,
        }),
        sourceSystemId: props.voice.sourceSystemId,
      },
    });
  }

  const message = await props.createMessage({
    data: {
      description: props.description || "",
      files: [transcriptionFile],
      metadata: buildTelegramVoiceTranscriptionMetadata({
        model,
        now: now(),
        originalFile,
        status: "processing",
        transcriptionFile,
        voice: props.voice,
      }),
      sourceSystemId: props.voice.sourceSystemId,
    },
  });

  if (
    getTelegramVoiceTranscriptionStatus(message) &&
    getTelegramVoiceTranscriptionStatus(message) !== "processing"
  ) {
    return message;
  }

  try {
    const transcription = await props.transcribeAudio({
      file: transcriptionFile,
      model,
    });

    return normalizeMessageResult(
      await props.updateMessage({
        data: {
          description: transcription.text,
          metadata: mergeMessageMetadata({
            metadata: message.metadata,
            voiceMetadata: buildTelegramVoiceTranscriptionMetadata({
              model,
              now: now(),
              originalFile,
              status: "completed",
              transcriptMetadata: transcription.metadata,
              transcriptionFile,
              voice: props.voice,
            }),
          }),
        },
        message,
      }),
    );
  } catch (error) {
    return normalizeMessageResult(
      await props.updateMessage({
        data: {
          metadata: mergeMessageMetadata({
            metadata: message.metadata,
            voiceMetadata: buildTelegramVoiceTranscriptionMetadata({
              error: normalizeTelegramVoiceError({
                category:
                  error instanceof TelegramVoiceTranscriptionError
                    ? error.category
                    : "transcription",
                error,
              }),
              model,
              now: now(),
              originalFile,
              status: "failed",
              transcriptionFile,
              voice: props.voice,
            }),
          }),
        },
        message,
      }),
    );
  }
}

function buildTelegramVoiceTranscriptionMetadata(props: {
  error?: TelegramVoiceTranscriptionError;
  model: string;
  now: string;
  originalFile?: File;
  status: "processing" | "completed" | "failed";
  transcriptMetadata?: unknown;
  transcriptionFile?: File;
  voice: TelegramVoiceMessageData;
}): Record<string, unknown> {
  return {
    [TELEGRAM_VOICE_TRANSCRIPTION_METADATA_KEY]: {
      agentTrigger:
        props.status === "completed"
          ? TELEGRAM_VOICE_TRANSCRIPTION_ACTION_TYPE
          : undefined,
      audio: {
        original: props.originalFile
          ? serializeFileMetadata(props.originalFile)
          : undefined,
        transcription: props.transcriptionFile
          ? serializeFileMetadata(props.transcriptionFile)
          : undefined,
      },
      completedAt: props.status === "completed" ? props.now : undefined,
      error: props.error
        ? {
            category: props.error.category,
            message: props.error.message,
          }
        : undefined,
      failedAt: props.status === "failed" ? props.now : undefined,
      model: props.model,
      provider: "openai",
      sourceSystemId: props.voice.sourceSystemId,
      startedAt: props.status === "processing" ? props.now : undefined,
      status: props.status,
      telegram: {
        duration: props.voice.duration,
        fileId: props.voice.fileId,
        fileUniqueId: props.voice.fileUniqueId,
        mimeType: props.voice.mimeType,
      },
      transcriptMetadata: props.transcriptMetadata,
    },
  };
}

function mergeMessageMetadata(props: {
  metadata?: Record<string, unknown> | null;
  voiceMetadata: Record<string, unknown>;
}) {
  return {
    ...(props.metadata || {}),
    ...props.voiceMetadata,
  };
}

function normalizeMessageResult(
  value: ISocialModuleMessage | ISocialModuleMessage[] | undefined,
) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeTelegramVoiceError(props: {
  category: "download" | "conversion" | "transcription" | "validation";
  error: unknown;
}) {
  if (props.error instanceof TelegramVoiceTranscriptionError) {
    return props.error;
  }

  return new TelegramVoiceTranscriptionError({
    category: props.category,
    message:
      props.error instanceof Error
        ? props.error.message
        : String(props.error || "Unknown Telegram voice processing error"),
  });
}

function serializeFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const stderr: Buffer[] = [];

    child.stderr?.on("data", (chunk) => {
      stderr.push(Buffer.from(chunk));
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `ffmpeg exited with code ${code}: ${Buffer.concat(stderr)
            .toString("utf8")
            .trim()}`,
        ),
      );
    });
  });
}
