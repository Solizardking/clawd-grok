/**
 * Shared TypeScript types for Clawd CLI.
 */

// === Chat / Agent Types ===

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatEntry {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
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
  result: ToolResult;
}

export interface StreamError {
  type: "error";
  message: string;
}

export interface StreamDone {
  type: "done";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamChunk = StreamToken | StreamToolCall | StreamToolResult | StreamError | StreamDone;

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
  };
  mcpServers?: Record<string, McpServerConfig>;
}

export interface SubAgentConfig {
  name: string;
  model: string;
  instruction: string;
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