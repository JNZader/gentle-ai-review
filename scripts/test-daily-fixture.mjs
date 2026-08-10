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
  const firstDailyBytes = await readFile(path.join(temporary, "daily", "2026-08-11.json"));
  const unchanged = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--output-dir", temporary, "--date", "2026-08-12", "--observed-at", "2026-08-12T05:00:00Z"], { encoding: "utf8" });
  if (unchanged.status !== 0) throw new Error(unchanged.stderr || unchanged.stdout);
  const unchangedResult = JSON.parse(unchanged.stdout);
  if (unchangedResult.changed !== false || !firstBytes.equals(await readFile(path.join(temporary, "latest.json")))) throw new Error("Unchanged fixture created snapshot noise");

  const sameDayFixture = path.join(temporary, "same-day-fixture"); await mkdir(sameDayFixture);
  for (const name of ["issues", "pulls", "releases", "tags"]) {
    const value = JSON.parse(await readFile(path.join(root, "test", "fixtures", "daily", `${name}.json`), "utf8"));
    if (name === "issues") value[0].updated_at = "2026-08-11T05:30:00Z";
    await writeFile(path.join(sameDayFixture, `${name}.json`), JSON.stringify(value));
  }
  const sameDay = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", sameDayFixture, "--output-dir", temporary, "--date", "2026-08-11", "--observed-at", "2026-08-11T06:00:00Z"], { encoding: "utf8" });
  if (sameDay.status !== 0) throw new Error(sameDay.stderr || sameDay.stdout);
  const secondDaily = JSON.parse(await readFile(path.join(temporary, "daily", "2026-08-11T06-00-00Z.json"), "utf8"));
  const sameDayLatest = JSON.parse(await readFile(path.join(temporary, "latest.json"), "utf8"));
  if (!firstDailyBytes.equals(await readFile(path.join(temporary, "daily", "2026-08-11.json")))) throw new Error("Second same-day refresh overwrote the first daily snapshot");
  if (secondDaily.observed_at !== "2026-08-11T06:00:00Z" || sameDayLatest.observed_at !== secondDaily.observed_at) throw new Error("Second same-day snapshot did not become latest");
  const renderedOutput = path.join(temporary, "rendered-data");
  const rendered = spawnSync(process.execPath, [path.join(root, "scripts", "render-daily-page.mjs"), temporary, renderedOutput], { encoding: "utf8" });
  if (rendered.status !== 0) throw new Error(rendered.stderr || rendered.stdout);
  const renderedLatest = JSON.parse(await readFile(path.join(renderedOutput, "latest.json"), "utf8"));
  const renderedHistory = JSON.parse(await readFile(path.join(renderedOutput, "history.json"), "utf8"));
  if (renderedLatest.observed_at !== secondDaily.observed_at || renderedHistory.snapshots.length !== 1 || renderedHistory.snapshots[0].observed_at !== snapshot.observed_at) throw new Error("Same-day snapshots broke latest or canonical daily history rendering");

  const missingLatestOutput = path.join(temporary, "canonical-without-latest");
  await mkdir(path.join(missingLatestOutput, "daily"), { recursive: true });
  const missingLatestCanonical = path.join(missingLatestOutput, "daily", "2026-08-14.json");
  await writeFile(missingLatestCanonical, firstDailyBytes);
  const missingLatest = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--output-dir", missingLatestOutput, "--date", "2026-08-14", "--observed-at", "2026-08-14T07:00:00Z"], { encoding: "utf8" });
  if (missingLatest.status !== 0) throw new Error(missingLatest.stderr || missingLatest.stdout);
  if (!firstDailyBytes.equals(await readFile(missingLatestCanonical))) throw new Error("Refresh without latest overwrote an existing canonical snapshot");
  const missingLatestTimestamped = JSON.parse(await readFile(path.join(missingLatestOutput, "daily", "2026-08-14T07-00-00Z.json"), "utf8"));
  if (missingLatestTimestamped.observed_at !== "2026-08-14T07:00:00Z") throw new Error("Refresh without latest did not write a timestamped snapshot");

  const differentLatestOutput = path.join(temporary, "canonical-with-different-latest");
  await mkdir(path.join(differentLatestOutput, "daily"), { recursive: true });
  const differentLatestCanonical = path.join(differentLatestOutput, "daily", "2026-08-15.json");
  await writeFile(differentLatestCanonical, firstDailyBytes);
  await writeFile(path.join(differentLatestOutput, "latest.json"), await readFile(path.join(root, "test", "fixtures", "daily", "previous.json")));
  const differentLatest = spawnSync(process.execPath, [path.join(root, "scripts", "refresh-upstream.mjs"), "--fixture", path.join(root, "test", "fixtures", "daily"), "--output-dir", differentLatestOutput, "--date", "2026-08-15", "--observed-at", "2026-08-15T08:00:00Z"], { encoding: "utf8" });
  if (differentLatest.status !== 0) throw new Error(differentLatest.stderr || differentLatest.stdout);
  if (!firstDailyBytes.equals(await readFile(differentLatestCanonical))) throw new Error("Refresh with a different-date latest overwrote an existing canonical snapshot");
  const differentLatestTimestamped = JSON.parse(await readFile(path.join(differentLatestOutput, "daily", "2026-08-15T08-00-00Z.json"), "utf8"));
  if (differentLatestTimestamped.observed_at !== "2026-08-15T08:00:00Z") throw new Error("Refresh with a different-date latest did not write a timestamped snapshot");
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
  console.log(JSON.stringify({ fixture: "PASS", counts: snapshot.counts, changes: expected, unchanged_writes: 0, same_day_history_preserved: true, same_day_page_lookup_preserved: true, canonical_without_latest_preserved: true, canonical_with_different_latest_preserved: true, corrupt_previous_rejected: true, string_boolean_rejected: true, duplicate_previous_rejected: true, duplicate_api_rejected: true }, null, 2));
} finally { await rm(temporary, { recursive: true, force: true }); }
