export const AUDIO_TRANSCRIPTION_METADATA_KEY = "audioTranscription";
export const AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY =
  "telegramVoiceTranscription";
export const AUDIO_TRANSCRIPTION_ACTION_TYPE = "audio_transcription_completed";
export const AUDIO_TRANSCRIPTION_DEFAULT_MODEL = "gpt-4o-transcribe";
export const AUDIO_TRANSCRIPTION_MAX_BYTES = 25 * 1024 * 1024;
/**
 * Levels under which a recording carries no audible speech. Transcription
 * models never return an empty string for such input, they invent a phrase, so
 * silent voice notes have to be rejected before the provider is called.
 *
 * A recording counts as silent only when it is quiet on average AND never had a
 * loud moment, so a brief utterance in a long recording still gets transcribed.
 * Calibrated on Telegram voice notes: speech averages -19 dB with -2 dB peaks,
 * while notes recorded with nobody speaking average -51 dB with -34 dB peaks —
 * microphone self-noise, never digital silence.
 */
export const AUDIO_TRANSCRIPTION_SILENCE_MEAN_VOLUME_DB = -40;
export const AUDIO_TRANSCRIPTION_SILENCE_MAX_VOLUME_DB = -25;
