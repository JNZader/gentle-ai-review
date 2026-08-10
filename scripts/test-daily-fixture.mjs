#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await mkdtemp(path.join(os.tmpdir(), "gentle-ai-review-fixture-"));
try {
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--previous", path.join(root, "test", "fixtures", "daily", "previous.json"), "--output-dir", temporary, "--date", "2026-08-11", "--observed-at", "2026-08-11T05:00:00Z"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const snapshot = JSON.parse(await readFile(path.join(temporary, "latest.json"), "utf8"));
  const expected = {
    issues: [1, 1, 1], pull_requests: [1, 1, 1], releases: [1, 1, 1], tags: [1, 1, 1]
  };
  for (const [group, counts] of Object.entries(expected)) {
    const actual = snapshot.changes[group];
    const found = [actual.new.length, actual.updated.length, actual.closed_or_no_longer_open.length];
    if (JSON.stringify(found) !== JSON.stringify(counts)) throw new Error(`${group} diff mismatch: ${found}`);
  }
  if (snapshot.counts.open_issues !== 2 || snapshot.counts.open_pull_requests !== 2) throw new Error("Fixture counts mismatch");
  const firstBytes = await readFile(path.join(temporary, "latest.json"));
  const unchanged = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--output-dir", temporary, "--date", "2026-08-12", "--observed-at", "2026-08-12T05:00:00Z"], { encoding: "utf8" });
  if (unchanged.status !== 0) throw new Error(unchanged.stderr || unchanged.stdout);
  const unchangedResult = JSON.parse(unchanged.stdout);
  if (unchangedResult.changed !== false || !firstBytes.equals(await readFile(path.join(temporary, "latest.json")))) throw new Error("Unchanged fixture created snapshot noise");
  const previous = JSON.parse(await readFile(path.join(root, "test", "fixtures", "daily", "previous.json"), "utf8"));
  previous.open_pull_requests[0].draft = "false";
  const corruptPrevious = path.join(temporary, "corrupt-previous.json");
  await writeFile(corruptPrevious, JSON.stringify(previous));
  const corruptOutput = path.join(temporary, "corrupt-output");
  const rejectedPrevious = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--previous", corruptPrevious, "--output-dir", corruptOutput, "--date", "2026-08-13", "--observed-at", "2026-08-13T05:00:00Z"], { encoding: "utf8" });
  if (rejectedPrevious.status === 0 || !rejectedPrevious.stderr.includes("previous.open_pull_requests[0].draft")) throw new Error("Corrupt previous snapshot was not rejected");
  try { await readFile(path.join(corruptOutput, "latest.json")); throw new Error("Corrupt previous snapshot wrote output"); } catch (error) { if (error.code !== "ENOENT") throw error; }

  const duplicatePrevious = JSON.parse(await readFile(path.join(root, "test", "fixtures", "daily", "previous.json"), "utf8"));
  duplicatePrevious.open_issues.push({ ...duplicatePrevious.open_issues[0] });
  duplicatePrevious.counts.open_issues += 1;
  const duplicatePreviousFile = path.join(temporary, "duplicate-previous.json");
  await writeFile(duplicatePreviousFile, JSON.stringify(duplicatePrevious));
  const duplicatePreviousOutput = path.join(temporary, "duplicate-previous-output");
  const rejectedDuplicatePrevious = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--previous", duplicatePreviousFile, "--output-dir", duplicatePreviousOutput, "--date", "2026-08-13", "--observed-at", "2026-08-13T05:00:00Z"], { encoding: "utf8" });
  if (rejectedDuplicatePrevious.status === 0 || !rejectedDuplicatePrevious.stderr.includes("Duplicate previous issue number: 1")) throw new Error("Duplicate identifier in previous snapshot was not rejected");
  try { await readFile(path.join(duplicatePreviousOutput, "latest.json")); throw new Error("Duplicate previous snapshot wrote output"); } catch (error) { if (error.code !== "ENOENT") throw error; }

  const badFixture = path.join(temporary, "bad-fixture"); await mkdir(badFixture);
  for (const name of ["issues", "pulls", "releases", "tags"]) {
    const value = JSON.parse(await readFile(path.join(root, "test", "fixtures", "daily", `${name}.json`), "utf8"));
    if (name === "pulls") value[0].draft = "false";
    await writeFile(path.join(badFixture, `${name}.json`), JSON.stringify(value));
  }
  const badApiOutput = path.join(temporary, "bad-api-output");
  const rejectedApi = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", badFixture, "--output-dir", badApiOutput, "--date", "2026-08-13", "--observed-at", "2026-08-13T05:00:00Z"], { encoding: "utf8" });
  if (rejectedApi.status === 0 || !rejectedApi.stderr.includes("pull.draft")) throw new Error("String boolean from API fixture was not rejected");
  try { await readFile(path.join(badApiOutput, "latest.json")); throw new Error("Bad API fixture wrote output"); } catch (error) { if (error.code !== "ENOENT") throw error; }

  const duplicateFixture = path.join(temporary, "duplicate-fixture"); await mkdir(duplicateFixture);
  for (const name of ["issues", "pulls", "releases", "tags"]) {
    const value = JSON.parse(await readFile(path.join(root, "test", "fixtures", "daily", `${name}.json`), "utf8"));
    if (name === "tags") value.push(structuredClone(value[0]));
    await writeFile(path.join(duplicateFixture, `${name}.json`), JSON.stringify(value));
  }
  const duplicateApiOutput = path.join(temporary, "duplicate-api-output");
  const rejectedDuplicateApi = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", duplicateFixture, "--output-dir", duplicateApiOutput, "--date", "2026-08-13", "--observed-at", "2026-08-13T05:00:00Z"], { encoding: "utf8" });
  if (rejectedDuplicateApi.status === 0 || !rejectedDuplicateApi.stderr.includes("Duplicate normalized tag name")) throw new Error("Duplicate identifier in API fixture was not rejected");
  try { await readFile(path.join(duplicateApiOutput, "latest.json")); throw new Error("Duplicate API fixture wrote output"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  console.log(JSON.stringify({ fixture: "PASS", counts: snapshot.counts, changes: expected, unchanged_writes: 0, corrupt_previous_rejected: true, string_boolean_rejected: true, duplicate_previous_rejected: true, duplicate_api_rejected: true }, null, 2));
} finally { await rm(temporary, { recursive: true, force: true }); }
