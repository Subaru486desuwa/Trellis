import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  installPostCommitHook,
  POST_COMMIT_HOOK_MARKER,
} from "../../src/utils/git-hooks.js";

describe("installPostCommitHook", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "polygon-githook-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function gitInit(): void {
    execSync("git init -q", { cwd: tmpDir, stdio: "ignore" });
  }

  function hookPath(): string {
    return path.join(tmpDir, ".git", "hooks", "post-commit");
  }

  it("installs a marked post-commit hook in a git repo", () => {
    gitInit();
    const result = installPostCommitHook(tmpDir);
    expect(result.status).toBe("installed");
    const content = fs.readFileSync(hookPath(), "utf-8");
    expect(content).toContain(POST_COMMIT_HOOK_MARKER);
    expect(content).toContain("task.py");
    expect(content).toContain("activity-commit");
    // executable bit set
    expect(fs.statSync(hookPath()).mode & 0o111).toBeTruthy();
  });

  it("uses the provided python command in the shim", () => {
    gitInit();
    installPostCommitHook(tmpDir, "python");
    const content = fs.readFileSync(hookPath(), "utf-8");
    expect(content).toContain('python "$ROOT/.polygon/scripts/task.py"');
  });

  it("is idempotent — re-running refreshes our own hook", () => {
    gitInit();
    installPostCommitHook(tmpDir);
    const second = installPostCommitHook(tmpDir);
    expect(second.status).toBe("refreshed");
    expect(fs.readFileSync(hookPath(), "utf-8")).toContain(
      POST_COMMIT_HOOK_MARKER,
    );
  });

  it("does not clobber a foreign post-commit hook", () => {
    gitInit();
    const foreign = "#!/bin/sh\necho husky\n";
    fs.writeFileSync(hookPath(), foreign, { mode: 0o755 });
    const result = installPostCommitHook(tmpDir);
    expect(result).toEqual({ status: "skipped", reason: "foreign-hook" });
    expect(fs.readFileSync(hookPath(), "utf-8")).toBe(foreign);
  });

  it("is a no-op outside a git repo", () => {
    const result = installPostCommitHook(tmpDir);
    expect(result).toEqual({ status: "skipped", reason: "not-a-git-repo" });
    expect(fs.existsSync(hookPath())).toBe(false);
  });
});
