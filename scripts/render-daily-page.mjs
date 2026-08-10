#!/usr/bin/env node
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.argv[2] || path.join(root, "data"));
const docsDataDir = path.resolve(process.argv[3] || path.join(root, "docs", "data"));
const schema = "gentle-ai-review.daily-snapshot/v1";

function validate(value) {
  if (value?.schema !== schema || value.repository !== "Gentleman-Programming/gentle-ai" || !/^\d{4}-\d{2}-\d{2}T/.test(value.observed_at) || !Number.isInteger(value.counts?.open_issues) || !Number.isInteger(value.counts?.open_pull_requests) || !value.changes) throw new Error("Invalid daily snapshot schema");
}
async function atomicWrite(target, bytes) {
  await mkdir(path.dirname(target), { recursive: true }); const temporary = `${target}.tmp-${process.pid}`; await writeFile(temporary, bytes); await rename(temporary, target);
}
async function writeIfChanged(target, bytes) {
  try { if ((await readFile(target)).equals(bytes)) return false; } catch (error) { if (error.code !== "ENOENT") throw error; }
  await atomicWrite(target, bytes); return true;
}

let latestBytes;
try { latestBytes = await readFile(path.join(dataDir, "latest.json")); }
catch (error) { if (error.code === "ENOENT") { console.log(JSON.stringify({ rendered: false, reason: "no-latest-snapshot" })); process.exit(0); } throw error; }
const latest = JSON.parse(latestBytes); validate(latest);
const dailyDir = path.join(dataDir, "daily");
const files = (await readdir(dailyDir)).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse();
const history = [];
for (const file of files.slice(0, 31)) {
  const value = JSON.parse(await readFile(path.join(dailyDir, file), "utf8")); validate(value);
  history.push({ date: value.date, observed_at: value.observed_at, counts: value.counts, change_counts: Object.fromEntries(Object.entries(value.changes).map(([key, item]) => [key, { new: item.new.length, updated: item.updated.length, closed_or_no_longer_open: item.closed_or_no_longer_open.length }])) });
}
const latestChanged = await writeIfChanged(path.join(docsDataDir, "latest.json"), latestBytes);
const historyChanged = await writeIfChanged(path.join(docsDataDir, "history.json"), Buffer.from(`${JSON.stringify({ schema: "gentle-ai-review.daily-history/v1", snapshots: history }, null, 2)}\n`));
console.log(JSON.stringify({ rendered: true, latest_changed: latestChanged, history_changed: historyChanged, history_count: history.length }, null, 2));
