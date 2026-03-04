import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sync } from "../src/sync.js";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("sync", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "contextkit-sync-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("syncs cursor rules to CLAUDE.md", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "api.md"), "Use REST patterns.", "utf-8");

    const claudePath = join(tempDir, "CLAUDE.md");
    const results = await sync({
      source: rulesDir,
      targets: [claudePath],
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.written).toBe(true);

    const content = await readFile(claudePath, "utf-8");
    expect(content).toContain("Use REST patterns.");
    expect(content).toContain("# Project Rules");
  });

  it("syncs to AGENTS.md with correct header", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "test.md"), "Test content.", "utf-8");

    const agentsPath = join(tempDir, "AGENTS.md");
    await sync({
      source: rulesDir,
      targets: [agentsPath],
    });

    const content = await readFile(agentsPath, "utf-8");
    expect(content).toContain("# Agent Instructions");
  });

  it("dry run does not write files", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "api.md"), "content", "utf-8");

    const claudePath = join(tempDir, "CLAUDE.md");
    const results = await sync({
      source: rulesDir,
      targets: [claudePath],
      dryRun: true,
    });

    expect(results[0]!.written).toBe(false);
    expect(results[0]!.changes).toBe(1);

    let threw = false;
    try {
      await readFile(claudePath, "utf-8");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("reports no changes when target is already synced", async () => {
    const rulesDir = join(tempDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, "api.md"), "content", "utf-8");

    const claudePath = join(tempDir, "CLAUDE.md");

    await sync({ source: rulesDir, targets: [claudePath] });
    const results = await sync({ source: rulesDir, targets: [claudePath] });

    expect(results[0]!.written).toBe(false);
    expect(results[0]!.changes).toBe(0);
  });
});
