import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ClawdSettings, SolanaConfig } from "../types/index.js";

// === Path Constants ===

export const CLAWD_HOME = path.join(os.homedir(), ".clawd");
export const USER_SETTINGS_PATH = path.join(CLAWD_HOME, "user-settings.json");
export const PROJECT_SETTINGS_DIR = ".clawd";
export const WORKSPACE_TRUST_PATH = path.join(CLAWD_HOME, "workspace-trust.json");
export const INSTALL_METADATA_PATH = path.join(CLAWD_HOME, "install-metadata.json");

// === User Settings ===

let userSettingsCache: ClawdSettings | null = null;

export function loadUserSettings(): ClawdSettings {
  if (userSettingsCache) return userSettingsCache;
  try {
    if (fs.existsSync(USER_SETTINGS_PATH)) {
      const raw = fs.readFileSync(USER_SETTINGS_PATH, "utf-8");
      userSettingsCache = JSON.parse(raw) as ClawdSettings;
      return userSettingsCache;
    }
  } catch {
    // Silently ignore parse errors
  }
  userSettingsCache = {};
  return userSettingsCache;
}

export function saveUserSettings(partial: Partial<ClawdSettings>): void {
  const current = loadUserSettings();
  const merged: ClawdSettings = { ...current, ...partial };
  // Deep merge for nested objects
  if (partial.subAgents) merged.subAgents = partial.subAgents;
  if (partial.hooks) merged.hooks = { ...current.hooks, ...partial.hooks };
  if (partial.telegram) merged.telegram = { ...current.telegram, ...partial.telegram };
  if (partial.mcpServers) merged.mcpServers = { ...current.mcpServers, ...partial.mcpServers };

  fs.mkdirSync(CLAWD_HOME, { recursive: true });
  fs.writeFileSync(USER_SETTINGS_PATH, JSON.stringify(merged, null, 2), "utf-8");
  userSettingsCache = merged;
}

// === Project Settings ===

let projectSettingsCache: Map<string, ClawdSettings> = new Map();

function getProjectSettingsPath(cwd: string): string {
  return path.join(cwd, PROJECT_SETTINGS_DIR, "settings.json");
}

export function loadProjectSettings(cwd: string): ClawdSettings {
  const cached = projectSettingsCache.get(cwd);
  if (cached) return cached;

  try {
    const settingsPath = getProjectSettingsPath(cwd);
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, "utf-8");
      const parsed = JSON.parse(raw) as ClawdSettings;
      projectSettingsCache.set(cwd, parsed);
      return parsed;
    }
  } catch {
    // Silently ignore parse errors
  }

  const empty: ClawdSettings = {};
  projectSettingsCache.set(cwd, empty);
  return empty;
}

export function saveProjectSettings(cwd: string, partial: Partial<ClawdSettings>): void {
  const current = loadProjectSettings(cwd);
  const merged: ClawdSettings = { ...current, ...partial };
  if (partial.mcpServers) merged.mcpServers = { ...current.mcpServers, ...partial.mcpServers };

  const dir = path.join(cwd, PROJECT_SETTINGS_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getProjectSettingsPath(cwd), JSON.stringify(merged, null, 2), "utf-8");
  projectSettingsCache.set(cwd, merged);
}

// === API Key Resolution ===

// Priority: env var > user settings > project settings
// Uses AI_API_KEY as the primary env var (replaces GROK_API_KEY)

export function getApiKey(): string | undefined {
  // 1. Environment variable — XAI_API_KEY is canonical, others are fallbacks
  const envKey = process.env.XAI_API_KEY || process.env.AI_API_KEY || process.env.GROK_API_KEY;
  if (envKey) return envKey;

  // 2. User settings
  const userSettings = loadUserSettings();
  // Check for legacy key first
  const settingsKey = (userSettings as Record<string, unknown>).aiKey as string | undefined
    || (userSettings as Record<string, unknown>).apiKey as string | undefined;
  if (settingsKey) return settingsKey;

  return undefined;
}

export function getBaseURL(): string {
  return process.env.AI_BASE_URL || process.env.GROK_BASE_URL || "https://api.x.ai/v1";
}

// === Solana / Phoenix Config ===

export function getSolanaConfig(): SolanaConfig {
  return {
    rpcUrl:
      process.env.SOLANA_TRACKER_RPC_URL ||
      process.env.SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    apiUrl: process.env.PHOENIX_API_URL || "https://perp-api.phoenix.trade",
    apiKey: process.env.PHOENIX_API_KEY,
  };
}

export function getSolanaTrackerConfig() {
  return {
    apiKey: process.env.SOLANA_TRACKER_API_KEY,
    rpcUrl: process.env.SOLANA_TRACKER_RPC_URL,
    wssUrl: process.env.SOLANA_TRACKER_WSS_URL,
    dataUrl: process.env.SOLANA_TRACKER_URL || "https://data.solanatracker.io",
  };
}

// === Sandbox Settings ===

export type SandboxMode = "shuru" | "off";

let sandboxOverride: { mode: SandboxMode; settings: SandboxSettings } | null = null;

export interface SandboxSettings {
  allowNet?: boolean;
  allowedHosts?: string[];
  ports?: string[];
  cpus?: number;
  memory?: string;
  diskSize?: string;
  checkpoint?: string;
  secrets?: Record<string, string>;
}

export function getCurrentSandboxMode(): SandboxMode {
  if (sandboxOverride) return sandboxOverride.mode;
  const userSettings = loadUserSettings();
  const configured = (userSettings as Record<string, unknown>).sandboxMode as SandboxMode | undefined;
  return configured || "off";
}

export function setCurrentSandboxMode(mode: SandboxMode): void {
  if (!sandboxOverride) sandboxOverride = { mode, settings: {} };
  sandboxOverride.mode = mode;
}

export function getCurrentSandboxSettings(): SandboxSettings {
  if (sandboxOverride) return sandboxOverride.settings;
  const userSettings = loadUserSettings();
  const configured = (userSettings as Record<string, unknown>).sandboxSettings as SandboxSettings | undefined;
  return configured || {};
}

export function mergeSandboxSettings(base: SandboxSettings, overrides: SandboxSettings): SandboxSettings {
  return {
    ...base,
    ...overrides,
    allowedHosts: overrides.allowedHosts ?? base.allowedHosts,
    ports: overrides.ports ?? base.ports,
  };
}

// === Payment Settings ===

export interface PaymentSettings {
  enabled: boolean;
  chain: string;
  approval: string;
  walletAddress?: string;
}

let paymentSettingsCache: PaymentSettings | null = null;
const PAYMENT_SETTINGS_PATH = path.join(CLAWD_HOME, "payment-settings.json");

export function loadPaymentSettings(): PaymentSettings {
  if (paymentSettingsCache) return paymentSettingsCache;
  try {
    if (fs.existsSync(PAYMENT_SETTINGS_PATH)) {
      const raw = fs.readFileSync(PAYMENT_SETTINGS_PATH, "utf-8");
      paymentSettingsCache = JSON.parse(raw) as PaymentSettings;
      return paymentSettingsCache;
    }
  } catch {
    // ignore
  }
  paymentSettingsCache = { enabled: false, chain: "solana", approval: "manual" };
  return paymentSettingsCache;
}

export function savePaymentSettings(partial: Partial<PaymentSettings>): void {
  const current = loadPaymentSettings();
  const merged = { ...current, ...partial };
  fs.mkdirSync(CLAWD_HOME, { recursive: true });
  fs.writeFileSync(PAYMENT_SETTINGS_PATH, JSON.stringify(merged, null, 2), "utf-8");
  paymentSettingsCache = merged;
}

// === Telegram Settings Helper ===

export function getTelegramBotToken(): string | undefined {
  const env = process.env.TELEGRAM_BOT_TOKEN;
  if (env) return env;
  const userSettings = loadUserSettings();
  return userSettings.telegram?.botToken;
}

// === Clear caches (useful for testing) ===

export function clearSettingsCache(): void {
  userSettingsCache = null;
  projectSettingsCache = new Map();
  paymentSettingsCache = null;
  sandboxOverride = null;
}