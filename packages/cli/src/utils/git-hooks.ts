/**
 * Git hook installation for Polygon.
 *
 * Installs a `post-commit` hook that stamps each real commit onto the active
 * task's `activity.jsonl` (via `task.py activity-commit`). This gives a
 * cross-LLM handoff trail without relying on the agent voluntarily running
 * `activity-append` — the gap that left mid-task handoffs blind.
 *
 * Safety contract:
 * - No-op outside a git repo (init may run before `git init`).
 * - Never clobbers a pre-existing foreign `post-commit` hook (husky, etc.) —
 *   it reports `foreign` so the caller can tell the user to wire it manually.
 * - Idempotent: a hook we previously wrote (identified by HOOK_MARKER) is
 *   refreshed in place.
 * - Honors `core.hooksPath` and worktrees by resolving the active hooks dir
 *   through `git rev-parse --git-path hooks`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const POST_COMMIT_HOOK_MARKER = "# polygon-activity-hook";

export type GitHookResult =
  | { status: "installed" }
  | { status: "refreshed" }
  | { status: "skipped"; reason: "not-a-git-repo" | "foreign-hook" };

function resolveHooksDir(cwd: string): string | null {
  try {
    const out = execFileSync("git", ["-C", cwd, "rev-parse", "--git-path", "hooks"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return null;
    return path.isAbsolute(out) ? out : path.join(cwd, out);
  } catch {
    return null; // not a git repo
  }
}

function buildShim(pythonCmd: string): string {
  return [
    "#!/bin/sh",
    POST_COMMIT_HOOK_MARKER,
    "# Stamps each commit onto the active Polygon task's activity log.",
    "# Safe: exits 0 on any error and stays silent when there's no active task.",
    'ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0',
    `${pythonCmd} "$ROOT/.polygon/scripts/task.py" activity-commit >/dev/null 2>&1 || true`,
    "",
  ].join("\n");
}

/**
 * Install (or refresh) the Polygon post-commit activity hook.
 *
 * @param cwd Project root.
 * @param pythonCmd Python executable the shim should call (default "python3").
 */
export function installPostCommitHook(
  cwd: string,
  pythonCmd = "python3",
): GitHookResult {
  const hooksDir = resolveHooksDir(cwd);
  if (!hooksDir) return { status: "skipped", reason: "not-a-git-repo" };

  const hookPath = path.join(hooksDir, "post-commit");
  const shim = buildShim(pythonCmd);

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (!existing.includes(POST_COMMIT_HOOK_MARKER)) {
      return { status: "skipped", reason: "foreign-hook" };
    }
    if (existing === shim) return { status: "refreshed" };
    fs.writeFileSync(hookPath, shim, { mode: 0o755 });
    return { status: "refreshed" };
  }

  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(hookPath, shim, { mode: 0o755 });
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    // chmod may be unsupported on some filesystems; git on Windows runs via sh.
  }
  return { status: "installed" };
}
