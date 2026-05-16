import { readFile } from "node:fs/promises";
import { basename, join, normalize } from "node:path";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { OpenAI } from "@sps/shared-third-parties";
import {
  AUDIO_TRANSCRIPTION_ACTION_TYPE,
  AUDIO_TRANSCRIPTION_DEFAULT_MODEL,
  AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY,
  AUDIO_TRANSCRIPTION_MAX_BYTES,
  AUDIO_TRANSCRIPTION_METADATA_KEY,
  OPEN_AI_TRANSCRIPTION_MODEL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import * as jwt from "hono/jwt";

const AUDIO_EXTENSIONS = [
  "aac",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "webm",
];

type AudioTranscriptionStatus = "processing" | "completed" | "failed";

type AudioTranscriptionMetadata = {
  status?: unknown;
  agentTrigger?: unknown;
};

export function getAudioTranscriptionMetadata(
  message?: Pick<ISocialModuleMessage, "metadata">,
): AudioTranscriptionMetadata | undefined {
  const metadata = message?.metadata;

  if (!metadata || typeof metadata !== "object") {
    return;
  }

  const genericValue = metadata[AUDIO_TRANSCRIPTION_METADATA_KEY];
  const legacyValue = metadata[AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY];
  const value = genericValue || legacyValue;

  if (!value || typeof value !== "object") {
    return;
  }

  return value as AudioTranscriptionMetadata;
}

export function getAudioTranscriptionStatus(
  message?: Pick<ISocialModuleMessage, "metadata">,
) {
  const metadata = getAudioTranscriptionMetadata(message);

  if (!metadata || !("status" in metadata)) {
    return;
  }

  return String(metadata.status || "");
}

export function shouldSkipOrdinaryNotificationForAudioTranscription(
  message: Pick<ISocialModuleMessage, "metadata">,
) {
  const status = getAudioTranscriptionStatus(message);

  return status === "processing" || status === "failed";
}

export class AudioTranscriptionService {
  async prepareAndRun(props: {
    fileStorageModuleFiles?: IFileStorageModuleFile[];
    now?: () => string;
    rbacModuleSubjectId: string;
    socialModuleChatId: string;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleProfileId: string;
    socialModuleThreadId: string;
  }) {
    const audioFiles = (props.fileStorageModuleFiles || []).filter((file) =>
      this.isEligibleAudioFile(file),
    );

    if (!audioFiles.length) {
      return props.socialModuleMessage;
    }

    const existingStatus = getAudioTranscriptionStatus(
      props.socialModuleMessage,
    );

    if (existingStatus === "processing" || existingStatus === "completed") {
      return props.socialModuleMessage;
    }

    const now = props.now || (() => new Date().toISOString());
    const model =
      OPEN_AI_TRANSCRIPTION_MODEL || AUDIO_TRANSCRIPTION_DEFAULT_MODEL;
    const processingMessage = await this.updateMessageMetadata({
      metadata: this.buildMetadata({
        files: audioFiles,
        model,
        now: now(),
        status: "processing",
      }),
      socialModuleMessage: props.socialModuleMessage,
    });

    void this.transcribeMessage({
      ...props,
      files: audioFiles,
      model,
      now,
      socialModuleMessage: processingMessage,
    }).catch((error) => {
      console.error("Audio transcription background task failed", {
        message:
          error instanceof Error
            ? error.message
            : String(error || "Unknown audio transcription error"),
        socialModuleMessageId: processingMessage.id,
      });
    });

    return processingMessage;
  }

  protected async transcribeMessage(props: {
    files: IFileStorageModuleFile[];
    model: string;
    now: () => string;
    rbacModuleSubjectId: string;
    socialModuleChatId: string;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleProfileId: string;
    socialModuleThreadId: string;
  }) {
    try {
      const openAI = new OpenAI();
      const transcriptions: {
        fileStorageModuleFileId: string;
        metadata: unknown;
        text: string;
      }[] = [];

      for (const fileStorageModuleFile of props.files) {
        const file = await this.readFileStorageModuleFile({
          fileStorageModuleFile,
        });

        this.assertFileSize({ file });

        const transcription = await openAI.transcribeAudio({
          file,
          model: props.model,
        });

        transcriptions.push({
          fileStorageModuleFileId: fileStorageModuleFile.id,
          metadata: transcription.metadata,
          text: transcription.text,
        });
      }

      const completedMessage = await this.updateMessageMetadata({
        description: transcriptions.map((item) => item.text).join("\n\n"),
        metadata: this.buildMetadata({
          files: props.files,
          model: props.model,
          now: props.now(),
          status: "completed",
          transcriptions: transcriptions.map((transcription) => {
            return {
              fileStorageModuleFileId: transcription.fileStorageModuleFileId,
              metadata: transcription.metadata,
            };
          }),
        }),
        socialModuleMessage: props.socialModuleMessage,
      });
      const transcriptText = completedMessage.description || "";

      await this.renameFallbackThreadFromTranscription({
        rbacModuleSubjectId: props.rbacModuleSubjectId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        transcriptText,
      });

      try {
        await this.createCompletedAction({
          rbacModuleSubjectId: props.rbacModuleSubjectId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleMessage: completedMessage,
          socialModuleProfileId: props.socialModuleProfileId,
          socialModuleThreadId: props.socialModuleThreadId,
        });
      } catch (error) {
        console.error("Audio transcription completion action failed", {
          message:
            error instanceof Error
              ? error.message
              : String(
                  error ||
                    "Unknown audio transcription completion action error",
                ),
          socialModuleMessageId: completedMessage.id,
          stage: "completion-action",
        });
      }
    } catch (error) {
      const category = this.getErrorCategory(error);

      console.error("Audio transcription failed", {
        category,
        message:
          error instanceof Error
            ? error.message
            : String(error || "Unknown audio transcription error"),
        socialModuleMessageId: props.socialModuleMessage.id,
        stage: "transcription",
      });

      await this.updateMessageMetadata({
        metadata: this.buildMetadata({
          error: {
            category,
          },
          files: props.files,
          model: props.model,
          now: props.now(),
          status: "failed",
        }),
        socialModuleMessage: props.socialModuleMessage,
      });
    }
  }

  protected async createCompletedAction(props: {
    rbacModuleSubjectId: string;
    socialModuleChatId: string;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleProfileId: string;
    socialModuleThreadId: string;
  }) {
    const authorization = await this.createSubjectAuthorizationHeader({
      rbacModuleSubjectId: props.rbacModuleSubjectId,
    });

    await rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate({
      id: props.rbacModuleSubjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      params: {
        socialModuleThreadId: props.socialModuleThreadId,
      },
      data: {
        payload: {
          type: AUDIO_TRANSCRIPTION_ACTION_TYPE,
          message: props.socialModuleMessage,
        },
      },
      options: {
        headers: {
          Authorization: authorization,
        },
      },
    });
  }

  protected async renameFallbackThreadFromTranscription(props: {
    rbacModuleSubjectId: string;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    transcriptText: string;
  }) {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const title = this.buildThreadTitleFromTranscription({
        transcriptText: props.transcriptText,
      });

      if (!title) {
        return;
      }

      const socialModuleThread = await socialModuleThreadApi.findById({
        id: props.socialModuleThreadId,
        options: {
          headers: {
            "Cache-Control": "no-store",
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (
        !socialModuleThread ||
        !this.shouldRenameThreadFromTranscription({
          socialModuleThread,
        })
      ) {
        return;
      }

      const currentTitle = socialModuleThread.title?.trim();

      if (currentTitle === title) {
        return;
      }

      const authorization = await this.createSubjectAuthorizationHeader({
        rbacModuleSubjectId: props.rbacModuleSubjectId,
      });

      await rbacSubjectApi.socialModuleChatFindByIdThreadUpdate({
        id: props.rbacModuleSubjectId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          title,
        },
        options: {
          headers: {
            Authorization: authorization,
          },
        },
      });
    } catch (error) {
      console.error("Audio transcription thread rename failed", {
        message:
          error instanceof Error
            ? error.message
            : String(
                error || "Unknown audio transcription thread rename error",
              ),
        socialModuleThreadId: props.socialModuleThreadId,
        stage: "thread-rename",
      });
    }
  }

  protected shouldRenameThreadFromTranscription(props: {
    socialModuleThread: {
      sourceSystemId?: string | null;
      title?: string | null;
    };
  }) {
    const title = props.socialModuleThread.title?.trim();

    if (!title || title === "New Chat") {
      return true;
    }

    const sourceSystemId = props.socialModuleThread.sourceSystemId?.trim();

    if (sourceSystemId && title === `Telegram topic ${sourceSystemId}`) {
      return true;
    }

    return /^Telegram topic \d+$/.test(title);
  }

  protected buildThreadTitleFromTranscription(props: {
    transcriptText: string;
  }) {
    const text = props.transcriptText.replace(/\s+/g, " ").trim();

    if (!text || text.startsWith("/")) {
      return;
    }

    const title = text
      .replace(/[.!?]+$/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")
      .slice(0, 128)
      .trim();

    return title || undefined;
  }

  protected async createSubjectAuthorizationHeader(props: {
    rbacModuleSubjectId: string;
  }) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      );
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const token = await jwt.sign(
      {
        exp: nowInSeconds + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: nowInSeconds,
        subject: {
          id: props.rbacModuleSubjectId,
        },
      },
      RBAC_JWT_SECRET,
    );

    return `Bearer ${token}`;
  }

  protected async updateMessageMetadata(props: {
    description?: string;
    metadata: Record<string, unknown>;
    socialModuleMessage: ISocialModuleMessage;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const data = {
      ...props.socialModuleMessage,
      description:
        props.description === undefined
          ? props.socialModuleMessage.description
          : props.description,
      metadata: this.mergeMetadata({
        metadata: props.socialModuleMessage.metadata,
        patch: props.metadata,
      }),
    };

    const updatedMessage = await socialModuleMessageApi.update({
      id: props.socialModuleMessage.id,
      data,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (Array.isArray(updatedMessage)) {
      return updatedMessage[0] || (data as ISocialModuleMessage);
    }

    return updatedMessage || (data as ISocialModuleMessage);
  }

  protected mergeMetadata(props: {
    metadata?: Record<string, unknown> | null;
    patch: Record<string, unknown>;
  }) {
    return {
      ...(props.metadata || {}),
      ...props.patch,
    };
  }

  protected buildMetadata(props: {
    error?: {
      category: string;
    };
    files: IFileStorageModuleFile[];
    model: string;
    now: string;
    status: AudioTranscriptionStatus;
    transcriptions?: {
      fileStorageModuleFileId: string;
      metadata: unknown;
    }[];
  }) {
    return {
      [AUDIO_TRANSCRIPTION_METADATA_KEY]: {
        agentTrigger:
          props.status === "completed"
            ? AUDIO_TRANSCRIPTION_ACTION_TYPE
            : undefined,
        completedAt: props.status === "completed" ? props.now : undefined,
        error: props.error,
        failedAt: props.status === "failed" ? props.now : undefined,
        files: props.files.map((file) => this.serializeFileStorageFile(file)),
        model: props.model,
        provider: "openai",
        startedAt: props.status === "processing" ? props.now : undefined,
        status: props.status,
        transcriptions: props.transcriptions,
      },
    };
  }

  protected serializeFileStorageFile(file: IFileStorageModuleFile) {
    return {
      extension: file.extension,
      file: file.file,
      id: file.id,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  protected getErrorCategory(error: unknown) {
    if (error instanceof AudioTranscriptionValidationError) {
      return error.category;
    }

    return "transcription";
  }

  protected assertFileSize(props: { file: File }) {
    if (props.file.size <= AUDIO_TRANSCRIPTION_MAX_BYTES) {
      return;
    }

    throw new AudioTranscriptionValidationError({
      category: "validation",
      message: `Audio file exceeds OpenAI transcription limit: ${props.file.size} bytes`,
    });
  }

  protected async readFileStorageModuleFile(props: {
    fileStorageModuleFile: IFileStorageModuleFile;
  }) {
    const source = props.fileStorageModuleFile.file;
    const transcriptionFile = this.getOpenAITranscriptionFileInfo(
      props.fileStorageModuleFile,
    );

    if (/^https?:\/\//i.test(source)) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(
          `Audio file download failed with status ${response.status}`,
        );
      }

      const responseType = response.headers.get("content-type") || "";
      const type =
        responseType && responseType !== "application/octet-stream"
          ? responseType
          : transcriptionFile.type;

      return new File([await response.arrayBuffer()], transcriptionFile.name, {
        type,
      });
    }

    const relativePath = normalize(source.replace(/^\/+/, ""));

    if (!relativePath || relativePath.startsWith("..")) {
      throw new Error("Validation error. Invalid file-storage path");
    }

    const candidates = [
      join(process.cwd(), "public", relativePath),
      join(process.cwd(), "apps/api/public", relativePath),
    ];

    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        const buffer = await readFile(candidate);

        return new File([new Uint8Array(buffer)], transcriptionFile.name, {
          type: transcriptionFile.type,
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Audio file could not be read from file-storage: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }

  protected getOpenAITranscriptionFileInfo(file: IFileStorageModuleFile) {
    const fileName = this.getTranscriptionFileName(file);
    const extension = fileName.split("?")[0].split(".").pop()?.toLowerCase();
    const type = file.mimeType || "application/octet-stream";

    if (extension === "oga") {
      return {
        name: fileName.replace(/\.oga$/i, ".ogg"),
        type: "audio/ogg",
      };
    }

    return {
      name: fileName,
      type,
    };
  }

  protected getTranscriptionFileName(file: IFileStorageModuleFile) {
    const sourceName = basename(file.file.split("?")[0] || "audio");

    if (sourceName.includes(".")) {
      return sourceName;
    }

    return `${sourceName}.${file.extension || "bin"}`;
  }

  protected isEligibleAudioFile(file: IFileStorageModuleFile) {
    const mimeType = file.mimeType || "";
    const extension =
      file.extension ||
      file.file.split("?")[0].split(".").pop()?.toLowerCase() ||
      "";
    const isAudioOnlyWebm =
      mimeType === "video/webm" && !file.width && !file.height;
    const hasAudioExtension = AUDIO_EXTENSIONS.includes(
      extension.toLowerCase(),
    );

    return Boolean(
      mimeType.startsWith("audio/") ||
        isAudioOnlyWebm ||
        ((mimeType === "" ||
          mimeType === "application/octet-stream" ||
          mimeType === "application/ogg") &&
          hasAudioExtension),
    );
  }
}

class AudioTranscriptionValidationError extends Error {
  category: "validation";

  constructor(props: { category: "validation"; message: string }) {
    super(props.message);
    this.category = props.category;
  }
}
