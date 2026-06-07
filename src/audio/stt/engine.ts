import type { TelegramSettings } from "../../utils/settings";
import { getApiKey, getBaseURL, resolveTelegramAudioInputSettings } from "../../utils/settings";
import { ClawdSttEngine, type ClawdSttTranscriptionResult } from "./clawd-stt";

export interface AudioTranscriptionInput {
  audioPath: string;
  fileName?: string;
  mimeType?: string;
}

export type AudioTranscriptionResult = ClawdSttTranscriptionResult;

export interface AudioTranscriptionEngine {
  transcribe(input: AudioTranscriptionInput): Promise<AudioTranscriptionResult>;
}

export function createTelegramAudioInputEngine(
  telegramSettings: TelegramSettings | undefined,
): AudioTranscriptionEngine {
  const resolved = resolveTelegramAudioInputSettings(telegramSettings);
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Clawd STT requires an API key. Set AI_API_KEY or configure apiKey in ~/.clawd/user-settings.json.",
    );
  }

  return new ClawdSttEngine({
    apiKey,
    baseURL: getBaseURL(),
    language: resolved.language,
  });
}
