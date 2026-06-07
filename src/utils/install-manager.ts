import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import readline from "node:readline";

export const CLAWD_GITHUB_REPO = "clawd/clawd-cli";
export const CLAWD_RELEASES_API = `https://api.github.com/repos/${CLAWD_GITHUB_REPO}/releases`;
export const SCRIPT_INSTALL_METHOD = "script";
const INSTALL_SCHEMA_VERSION = 1;
const CONFIG_DIR = ".clawd";
const PATH_MARKER = "# clawd";
const CONFIG_FILENAMES = ["user-settings.json", "AGENTS.md", "config.toml"];
const DATA_ENTRIES = ["daemon.pid", "delegations", "clawd.db", "models", "schedules", "solana"];

interface ReleaseTarget {
  key: string;
  assetName: string;
  binaryName: string;
}

interface InstallMetadata {
  version: string;
  repo: string;
  binaryPath: string;
  installDir: string;
  assetName: string;
  target: string;
  installedAt: string;
  method: string;
}

interface ReleaseDownload {
  version: string;
  assetName: string;
  downloadUrl: string;
  checksumUrl: string;
}

interface UninstallPlan {
  removePaths: string[];
  pruneDirs: string[];
}

interface UpdateResult {
  success: boolean;
  output: string;
}

export function getClawdUserDir(homeDir = os.homedir()): string {
  return path.join(homeDir, CONFIG_DIR);
}

export function getScriptInstallDir(homeDir = os.homedir()): string {
  return path.join(getClawdUserDir(homeDir), "bin");
}

export function getInstallMetadataPath(homeDir = os.homedir()): string {
  return path.join(getClawdUserDir(homeDir), "install.json");
}

export function getReleaseTargetForPlatform(
  platform: string = process.platform,
  arch: string = process.arch,
): ReleaseTarget | null {
  if (platform === "darwin" && (arch === "arm64" || arch === "x64"))
    return { key: "darwin-arm64", assetName: "clawd-darwin-arm64", binaryName: "clawd" };
  if (platform === "linux" && arch === "x64")
    return { key: "linux-x64", assetName: "clawd-linux-x64", binaryName: "clawd" };
  if (platform === "win32" && arch === "x64")
    return { key: "windows-x64", assetName: "clawd-windows-x64.exe", binaryName: "clawd.exe" };
  return null;
}

export function loadScriptInstallMetadata(homeDir = os.homedir()): InstallMetadata | null {
  try {
    const raw = fs.readFileSync(getInstallMetadataPath(homeDir), "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      version: typeof parsed.version === "string" ? parsed.version : "unknown",
      repo: typeof parsed.repo === "string" ? parsed.repo : CLAWD_GITHUB_REPO,
      binaryPath: parsed.binaryPath as string,
      installDir: parsed.installDir as string,
      assetName: parsed.assetName as string,
      target: parsed.target as string,
      installedAt: parsed.installedAt as string,
      method: parsed.method || SCRIPT_INSTALL_METHOD,
    };
  } catch {
    return null;
  }
}

export function saveScriptInstallMetadata(meta: Omit<InstallMetadata, "method">): void {
  fs.mkdirSync(getClawdUserDir(), { recursive: true });
  fs.writeFileSync(
    getInstallMetadataPath(),
    JSON.stringify({ ...meta, method: SCRIPT_INSTALL_METHOD }, null, 2),
    "utf-8",
  );
}

interface ScriptInstallContext {
  currentVersion: string;
  target: ReleaseTarget;
  binaryPath: string;
  installDir: string;
}

export function getScriptInstallContext(homeDir = os.homedir()): ScriptInstallContext | null {
  const meta = loadScriptInstallMetadata(homeDir);
  if (!meta) return null;

  const currentTarget = getReleaseTargetForPlatform();
  if (!currentTarget) return null;

  return {
    currentVersion: meta.version,
    target: currentTarget,
    binaryPath: meta.binaryPath,
    installDir: meta.installDir,
  };
}

async function fetchReleaseJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!resp.ok) return null;
    return (await resp.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeReleaseVersion(raw: string): string {
  let v = raw;
  if (v.startsWith("clawd@")) v = v.slice("clawd@".length);
  if (v.startsWith("v")) v = v.slice(1);
  return v;
}

export async function fetchLatestReleaseVersion(): Promise<string | null> {
  const release = await fetchReleaseJson(`${CLAWD_RELEASES_API}/latest`);
  return release ? normalizeReleaseVersion(release.tag_name as string) : null;
}

async function resolveReleaseDownload(target: ReleaseTarget): Promise<ReleaseDownload | null> {
  const release = await fetchReleaseJson(`${CLAWD_RELEASES_API}/latest`);
  if (!release) return null;

  const tagName = release.tag_name as string;
  let version = tagName;
  if (version.startsWith("clawd@")) version = version.slice("clawd@".length);
  if (version.startsWith("v")) version = version.slice(1);

  return {
    version,
    assetName: target.assetName,
    downloadUrl: `https://github.com/${CLAWD_GITHUB_REPO}/releases/download/${tagName}/${target.assetName}`,
    checksumUrl: `https://github.com/${CLAWD_GITHUB_REPO}/releases/download/${tagName}/clawd-checksums-sha256.txt`,
  };
}

export async function fetchChecksums(url: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const resp = await fetch(url);
    if (!resp.ok) return map;
    const text = await resp.text();
    for (const line of text.split("\n")) {
      const match = line.trim().match(/^([a-f0-9]+)\s+.+\*?(clawd-.+)$/i);
      if (match) map.set(match[2], match[1]);
    }
  } catch {
    // Best effort
  }
  return map;
}

export async function runScriptManagedUpdate(currentVersion: string): Promise<UpdateResult> {
  const ctx = getScriptInstallContext();
  if (!ctx) {
    return {
      success: false,
      output: `This install is not script-managed, so \`clawd update\` cannot proceed. Reinstall via install.sh.`,
    };
  }

  const release = await resolveReleaseDownload(ctx.target);
  if (!release) {
    return { success: false, output: "Failed to fetch the latest release." };
  }

  if (release.version <= currentVersion) {
    return { success: true, output: `Clawd is already up to date (${currentVersion}).` };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-update-"));
  try {
    const binPath = path.join(tempDir, ctx.target.binaryName);
    const binResp = await fetch(release.downloadUrl);
    if (!binResp.ok) {
      return { success: false, output: `Download failed (HTTP ${binResp.status}).` };
    }
    const buffer = Buffer.from(await binResp.arrayBuffer());
    fs.writeFileSync(binPath, buffer);
    fs.chmodSync(binPath, 0o755);

    const installDir = ctx.installDir;
    fs.mkdirSync(installDir, { recursive: true });
    const dest = path.join(installDir, ctx.target.binaryName);
    fs.copyFileSync(binPath, dest);

    const oldPath = ctx.binaryPath;
    if (oldPath && oldPath !== dest && fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }

    saveScriptInstallMetadata({
      version: release.version,
      repo: CLAWD_GITHUB_REPO,
      binaryPath: dest,
      installDir,
      assetName: ctx.target.assetName,
      target: ctx.target.key,
      installedAt: new Date().toISOString(),
    });

    return { success: true, output: `Updated to Clawd ${release.version}. Restart the CLI to use the new version.` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, output: `Update failed: ${msg}` };
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

export function buildScriptUninstallPlan(
  options: { keepConfig?: boolean; keepData?: boolean },
  homeDir = os.homedir(),
): UninstallPlan | null {
  const ctx = getScriptInstallContext(homeDir);
  if (!ctx) return null;

  const userDir = getClawdUserDir(homeDir);
  const removePaths = new Set<string>();
  removePaths.add(ctx.binaryPath);

  if (!options.keepConfig && !options.keepData) {
    removePaths.add(userDir);
  } else {
    if (!options.keepConfig) {
      for (const f of CONFIG_FILENAMES) {
        removePaths.add(path.join(userDir, f));
      }
      removePaths.add(path.join(userDir, "install.json"));
    }
    if (!options.keepData) {
      for (const entry of DATA_ENTRIES) {
        removePaths.add(path.join(userDir, entry));
      }
    }
  }

  const pruneDirs = [getScriptInstallDir(homeDir)];
  if (!options.keepConfig || !options.keepData) {
    pruneDirs.push(userDir);
  }

  return { removePaths: [...removePaths], pruneDirs };
}

export async function runScriptManagedUninstall(
  options: { dryRun?: boolean; force?: boolean; keepConfig?: boolean; keepData?: boolean },
  homeDir = os.homedir(),
): Promise<UpdateResult> {
  const plan = buildScriptUninstallPlan(options, homeDir);
  if (!plan) {
    return {
      success: false,
      output: `This install is not script-managed. Use the package manager you installed with, or reinstall via install.sh.`,
    };
  }

  if (options.dryRun) {
    const lines = ["Would remove:"];
    for (const p of plan.removePaths) lines.push(`  ${p}`);
    lines.push("Would prune empty dirs:");
    for (const d of plan.pruneDirs) lines.push(`  ${d}`);
    return { success: true, output: lines.join("\n") };
  }

  if (!options.force) {
    const confirmed = await confirmPrompt("Remove Clawd from this machine?");
    if (!confirmed) {
      return { success: false, output: "Uninstall cancelled." };
    }
  }

  for (const p of plan.removePaths) {
    try {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
      }
    } catch {
      // Continue on errors
    }
  }

  const removeDirIfEmpty = (dir: string) => {
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    } catch {
      // ignore
    }
  };

  for (const d of plan.pruneDirs) {
    removeDirIfEmpty(d);
  }

  return { success: true, output: "Clawd uninstalled successfully." };
}

async function confirmPrompt(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${message} [y/N] `, (a) => resolve(a.trim().toLowerCase()));
    });
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}