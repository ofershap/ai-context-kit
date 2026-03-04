import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadRules } from "../src/load.js";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadRules", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "contextkit-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("loads CLAUDE.md from root", async () => {
    await writeFile(
      join(tempDir, "CLAUDE.md"),
      "# Rules\nUse TypeScript.",
      "utf-8",
    );
    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.format).toBe("claude-md");
  });

  it("loads AGENTS.md from root", async () => {
    await writeFile(
      join(tempDir, "AGENTS.md"),
      "# Agent Rules\nBe helpful.",
      "utf-8",
    );
    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.format).toBe("agents-md");
  });

  it("loads .cursorrules from root", async () => {
    await writeFile(join(tempDir, ".cursorrules"), "rules content", "utf-8");
    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.format).toBe("cursor-legacy");
  });

  it("loads files from .cursor/rules/ directory", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "api.mdc"), "api rules", "utf-8");
    await writeFile(join(rulesDir, "style.md"), "style rules", "utf-8");

    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(2);
    expect(rules.every((r) => r.format === "cursor-rules")).toBe(true);
  });

  it("loads from multiple sources at once", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "claude rules", "utf-8");
    await writeFile(join(tempDir, "AGENTS.md"), "agent rules", "utf-8");

    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(2);
  });

  it("returns empty array when no rules found", async () => {
    const rules = await loadRules(tempDir);
    expect(rules).toEqual([]);
  });

  it("loads copilot instructions", async () => {
    const ghDir = join(tempDir, ".github");
    await mkdir(ghDir, { recursive: true });
    await writeFile(
      join(ghDir, "copilot-instructions.md"),
      "copilot rules",
      "utf-8",
    );

    const rules = await loadRules(tempDir);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.format).toBe("copilot-md");
  });

  it("loads directly from a .cursor/rules/ directory path", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "api.md"), "api rules", "utf-8");

    const rules = await loadRules(rulesDir);
    expect(rules).toHaveLength(1);
  });
});
