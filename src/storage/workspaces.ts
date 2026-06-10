import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import type { WorkspaceInfo } from "../types/index";
import { findGitRoot } from "../utils/git-root";
import { getDatabase } from "./db";

interface WorkspaceRow {
  id: string;
  scope_key: string;
  canonical_path: string;
  git_root: string | null;
  display_name: string;
  last_seen_at: string;
}

export interface ResolvedWorkspace {
  scopeKey: string;
  canonicalPath: string;
  gitRoot: string | null;
  displayName: string;
}

export function ensureWorkspace(cwd: string): WorkspaceInfo {
  const resolved = resolveWorkspace(cwd);
  const now = new Date().toISOString();
  const id = createHash("sha1").update(resolved.scopeKey).digest("hex").slice(0, 16);
  const db = getDatabase();

  const existing = db.prepare("SELECT id, scope_key FROM workspaces WHERE scope_key = ?").get(resolved.scopeKey) as { id: string } | undefined;
  if (existing) {
    db.prepare(`
      UPDATE workspaces SET
        canonical_path = @canonical_path,
        git_root = @git_root,
        display_name = @display_name,
        last_seen_at = @last_seen_at
      WHERE scope_key = @scope_key
    `).run({
      scope_key: resolved.scopeKey,
      canonical_path: resolved.canonicalPath,
      git_root: resolved.gitRoot,
      display_name: resolved.displayName,
      last_seen_at: now,
    });
  } else {
    db.prepare(`
      INSERT INTO workspaces (id, scope_key, canonical_path, git_root, display_name, last_seen_at)
      VALUES (@id, @scope_key, @canonical_path, @git_root, @display_name, @last_seen_at)
    `).run({
      id,
      scope_key: resolved.scopeKey,
      canonical_path: resolved.canonicalPath,
      git_root: resolved.gitRoot,
      display_name: resolved.displayName,
      last_seen_at: now,
    });
  }

  const row = db
    .prepare(`
    SELECT id, scope_key, canonical_path, git_root, display_name, last_seen_at
    FROM workspaces
    WHERE scope_key = ?
  `)
    .get(resolved.scopeKey) as WorkspaceRow | undefined;

  if (!row) {
    throw new Error(`Failed to resolve workspace for ${cwd}`);
  }

  return toWorkspaceInfo(row);
}

export function resolveWorkspace(cwd: string): ResolvedWorkspace {
  const canonicalPath = fs.realpathSync.native(cwd);
  const gitRoot = findGitRoot(canonicalPath);
  const scopePath = gitRoot || canonicalPath;

  return {
    scopeKey: scopePath,
    canonicalPath,
    gitRoot,
    displayName: path.basename(scopePath) || "workspace",
  };
}

function toWorkspaceInfo(row: WorkspaceRow): WorkspaceInfo {
  return {
    id: row.id,
    scopeKey: row.scope_key,
    canonicalPath: row.canonical_path,
    gitRoot: row.git_root,
    displayName: row.display_name,
    lastSeenAt: new Date(row.last_seen_at),
  };
}
