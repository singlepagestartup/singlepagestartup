export interface TelegramVoiceMessageData {
  duration?: number;
  fileId: string;
  fileUniqueId?: string;
  mimeType?: string;
  sourceSystemId: string;
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

export function extractTelegramAudioMessageData(
  message: any,
): TelegramVoiceMessageData | undefined {
  const sourceSystemId = message?.message_id?.toString();

  if (!sourceSystemId) {
    return;
  }

  if (message?.audio?.file_id) {
    return {
      duration: message.audio.duration,
      fileId: message.audio.file_id,
      fileUniqueId: message.audio.file_unique_id,
      mimeType: message.audio.mime_type,
      sourceSystemId,
    };
  }

  if (
    message?.document?.file_id &&
    isTelegramAudioAttachment({
      fileName: message.document.file_name,
      mimeType: message.document.mime_type,
    })
  ) {
    return {
      fileId: message.document.file_id,
      fileUniqueId: message.document.file_unique_id,
      mimeType: message.document.mime_type,
      sourceSystemId,
    };
  }

  return undefined;
}

function isTelegramAudioAttachment(props: {
  fileName?: string;
  mimeType?: string;
}) {
  if (props.mimeType?.startsWith("audio/")) {
    return true;
  }

  const extension = props.fileName?.split("?")[0].split(".").pop();

  return Boolean(
    extension &&
      [
        "aac",
        "flac",
        "m4a",
        "mp3",
        "oga",
        "ogg",
        "opus",
        "wav",
        "webm",
      ].includes(extension.toLowerCase()),
  );
}
