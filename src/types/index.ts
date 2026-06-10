/**
 * Shared TypeScript types for Clawd CLI.
 */

// === Chat / Agent Types ===

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  diff?: string;
  verifyRecipe?: VerifyRecipe;
  task?: string;
  media?: MediaAsset[];
  computer?: ComputerToolMetadata;
  plan?: Plan;
  lspDiagnostics?: any;
  delegation?: DelegationRun;
  backgroundProcess?: any;
}

export interface ToolCall {
  id: string;
  type?: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatEntry {
  role?: "system" | "user" | "assistant" | "tool";
  type?: string;
  content: string;
  timestamp?: Date;
  remoteKey?: string;
  modeColor?: string;
  sourceLabel?: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

// === Stream Types ===

export interface StreamToken {
  type: "token";
  text: string;
}

export interface StreamToolCall {
  type: "tool_call";
  id: string;
  name: string;
  arguments: string;
}

export interface StreamToolResult {
  type: "tool_result";
  id: string;
  name: string;
  arguments?: string;
  result: ToolResult;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

export interface StreamError {
  type: "error";
  message: string;
  content?: string;
  isAuthError?: boolean;
}

export interface StreamDone {
  type: "done";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamChunk = StreamToken | StreamToolCall | StreamToolResult | StreamError | StreamDone | { type: "content"; content: string } | { type: "tool_calls"; toolCalls: ToolCall[] } | { type: "reasoning"; text: string };

// === Solana Types ===

export interface SolanaConfig {
  rpcUrl: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface WalletInfo {
  name: string;
  publicKey: string;
  isDefault: boolean;
  createdAt: string;
}

export interface MarketInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  maxLeverage: number;
  fees: {
    makerBps: number;
    takerBps: number;
  };
}

export interface TickerData {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  lastPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  fundingRateApr: number;
  timestamp: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  orderCount?: number;
}

export interface OrderbookSnapshot {
  symbol: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeRecord {
  id: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  value: number;
  timestamp: number;
}

// === Position & Order Types ===

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  marginMode: "cross" | "isolated";
  marginUsed: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface OpenOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  price: number;
  size: number;
  filled: number;
  remaining: number;
  status: "open" | "partial" | "filled" | "cancelled";
  reduceOnly: boolean;
  postOnly: boolean;
  timestamp: number;
}

export interface MarginStatus {
  equity: number;
  availableBalance: number;
  marginUsed: number;
  marginRatio: number;
  maintenanceMargin: number;
  maintenanceMarginRatio: number;
  initialMarginRatio: number;
}

export interface PortfolioSnapshot {
  margin: MarginStatus;
  positions: Position[];
  orders: OpenOrder[];
  timestamp: number;
}

// === Strategy Types ===

export type ExecutionMode = "paper" | "dry-run" | "confirm-each" | "auto-execute";
export type MarginMode = "cross" | "isolated";
export type StrategyStatus = "running" | "paused" | "stopped" | "completed" | "error";

export interface StrategyRunInfo {
  id: string;
  type: "twap" | "grid" | "ta";
  symbol: string;
  status: StrategyStatus;
  label?: string;
  createdAt: string;
  updatedAt: string;
  executionMode: ExecutionMode;
}

export interface GuardrailConfig {
  maxTotalNotionalUsdc?: number;
  maxStepNotionalUsdc?: number;
  maxPriceDriftBps?: number;
  maxExposureRatio?: number;
  reconcileAttempts?: number;
  reconcileDelayMs?: number;
}

// === Technical Analysis Types ===

export type IndicatorName =
  | "sma"
  | "ema"
  | "rsi"
  | "macd"
  | "bbands"
  | "atr"
  | "vwap"
  | "adx"
  | "stoch";

export interface IndicatorParams {
  period?: number;
  fast?: number;
  slow?: number;
  signal?: number;
  multiplier?: number;
}

export interface IndicatorResult {
  indicator: IndicatorName;
  timeframe: string;
  value: number | number[];
  metadata?: Record<string, number>;
  timestamp: number;
}

export interface SignalSpec {
  indicator: IndicatorName;
  timeframe: string;
  op: "gt" | "lt" | "gte" | "lte" | "eq" | "cross_above" | "cross_below";
  threshold: number;
  params?: IndicatorParams;
}

// === API Types ===

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  ok: false;
  error: {
    category: string;
    code: string;
    message: string;
    retryable: boolean;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// === Agent Config Types ===

export interface AgentConfig {
  session?: string;
  sandboxMode?: string;
  sandboxSettings?: Record<string, unknown>;
  batchApi?: boolean;
}

export interface ClawdSettings {
  defaultModel?: string;
  defaultMaxToolRounds?: number;
  subAgents?: SubAgentConfig[];
  hooks?: HookConfig;
  telegram?: {
    botToken?: string;
    audioInput?: {
      enabled: boolean;
      language: string;
    };
    sessionsByUserId?: Record<string, string>;
    approvedUserIds?: string[];
    stream?: {
      enabled: boolean;
      previewTokens: number;
    };
    typingIndicator?: boolean;
  };
  mcpServers?: Record<string, McpServerConfig>;
}

export interface SubAgentConfig {
  name: string;
  model: string;
  instruction: string;
  enabled?: boolean;
}

export interface HookConfig {
  PreToolUse?: HookEvent[];
  PostToolUse?: HookEvent[];
  PostToolUseFailure?: HookEvent[];
  UserPromptSubmit?: HookEvent[];
  SessionStart?: HookEvent[];
  SessionEnd?: HookEvent[];
  Stop?: HookEvent[];
  StopFailure?: HookEvent[];
  SubagentStart?: HookEvent[];
  SubagentStop?: HookEvent[];
  Notification?: HookEvent[];
  InstructionsLoaded?: HookEvent[];
  CwdChanged?: HookEvent[];
}

export interface HookEvent {
  matcher?: string;
  hooks: HookDefinition[];
}

export interface HookDefinition {
  type: "command";
  command: string;
  timeout?: number;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// === Agent / App Types ===

export type AgentMode = "agent" | "plan" | "ask";

export const MODES: readonly AgentMode[] = ["agent", "plan"] as const;

export interface PlanStep {
  description: string;
  title?: string;
  tool?: string;
  args?: Record<string, unknown>;
  filePaths?: string[];
}

export interface PlanQuestion {
  id: string;
  question?: string;
  type: "confirm" | "single" | "multiselect" | "text";
  label: string;
  options?: Array<{ id: string; label: string; value: string }>;
  default?: string | string[];
  required?: boolean;
}

export interface Plan {
  title: string;
  summary: string;
  steps: PlanStep[];
  questions?: PlanQuestion[];
}

export interface SessionInfo {
  id: string;
  label: string | null;
  mode: AgentMode;
  model: string;
  startedAt: string;
  messageCount: number;
  tokenCount: number;
  totalTokensIn: number;
  totalTokensOut: number;
  title?: string;
  recap?: string;
}

export interface SessionSnapshot {
  id: string;
  label: string | null;
  mode: AgentMode;
  model: string;
  messageCount: number;
  tokenCount: number;
  workspace?: string;
  session?: string;
}

export interface SessionRecap {
  label: string;
  summary: string;
  id: string;
  createdAt: string;
  updatedAt?: string;
  text?: string;
  model?: string;
}

export type SessionStatus = "active" | "archived" | "compacted";

export interface SubagentStatus {
  name: string;
  agent?: string;
  status: "pending" | "running" | "completed" | "error" | "cancelled";
  progress?: string;
  error?: string;
  result?: string;
  detail?: string;
}

export interface TaskRequest {
  task?: string;
  agent?: string;
  description?: string;
  prompt?: string;
  model?: string;
  mode?: AgentMode;
  cwd?: string;
  sandbox?: Record<string, unknown>;
}

export type UsageSource = "agent" | "subagent" | "compaction" | "recap" | "side-question" | "title" | "other" | "task" | "message";

export interface FileDiff {
  path: string;
  diff: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  reasoning?: boolean;
  supportsClientTools?: boolean;
}

export type ReasoningEffort = "low" | "medium" | "high";

export interface UsageEvent {
  id: string;
  source: UsageSource;
  subagentName?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  timestamp: string;
  sessionId: string;
}

export interface WorkspaceInfo {
  id: string;
  path: string;
  gitRemote?: string;
  gitBranch?: string;
  label?: string;
  lastAccessedAt: string;
  sessionCount: number;
  totalTokens: number;
}

// === Verify Types ===

export interface VerifyRecipe {
  ecosystem: string;
  appKind: string;
  appLabel: string;
  shellInitCommands: string[];
  shellInit?: string[];
  bootstrapCommands: string[];
  bootstrap?: string[];
  installCommands: string[];
  install?: string[];
  buildCommands: string[];
  build?: string[];
  testCommands: string[];
  test?: string[];
  startCommand?: string;
  start?: string;
  startPort?: string;
  smokeKind: "http" | "cli" | "none";
  smokeTarget?: string;
  evidence: string[];
  notes: string[];
}

export interface VerifyArtifact {
  kind: string;
  path: string;
  description?: string;
  content?: string;
  checksum?: string;
}

export interface VerifyEnvironmentManifest {
  recipe?: VerifyRecipe;
  ecosystem?: string;
  appKind?: string;
  appLabel?: string;
  shellInitCommands?: string[];
  shellInit?: string[];
  bootstrapCommands?: string[];
  bootstrap?: string[];
  installCommands?: string[];
  install?: string[];
  buildCommands?: string[];
  build?: string[];
  testCommands?: string[];
  test?: string[];
  startCommand?: string;
  start?: string;
  startPort?: string;
  smokeKind?: string;
  smokeTarget?: string;
  evidence?: string[];
  notes?: string[];
  sandbox?: Record<string, unknown>;
  env?: Record<string, string>;
  files?: Record<string, string>;
}

export interface VerifyRetryStrategy {
  id: string;
  when: string;
  reason: string;
  commands: string[];
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

// === Misc Types ===

export interface ComputerToolMetadata {
  action?: string;
  app?: string;
  ref?: string;
  resolution?: string;
  screenshot?: boolean;
  window?: string;
  screenshotPath?: string;
}

export interface MediaAsset {
  url: string;
  path?: string;
  sourceUrl?: string;
  sourcePath?: string;
  kind?: string;
  mediaType?: string;
  type: "image" | "video" | "audio" | "other";
  mimeType?: string;
}

export interface DelegationRun {
  id: string;
  task: string;
  status: DelegationStatus;
  result?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export type DelegationStatus = "pending" | "running" | "completed" | "error" | "cancelled";

export interface PaymentPrecheck {
  required: boolean;
  amount?: number;
  currency?: string;
  chain?: string;
  reason?: string;
}
