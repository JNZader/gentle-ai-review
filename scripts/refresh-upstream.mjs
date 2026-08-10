#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_ORIGIN = "https://api.github.com";
const REPOSITORY = "Gentleman-Programming/gentle-ai";
const API_PREFIX = `/repos/${REPOSITORY}/`;
const API_ALLOWED_PREFIXES = Object.freeze([API_PREFIX, "/repositories/1168900408/"]);
const WEB_ORIGIN = "https://github.com";
const WEB_PREFIX = `/${REPOSITORY}/`;
const SCHEMA = "gentle-ai-review.daily-snapshot/v1";
const args = parseArgs(process.argv.slice(2));

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2); const next = values[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else { result[key] = next; index += 1; }
  }
  return result;
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const requireString = (value, field) => { if (typeof value !== "string" || !value) throw new Error(`Missing or invalid ${field}`); return value; };
const requireNumber = (value, field) => { if (!Number.isInteger(value) || value < 0) throw new Error(`Missing or invalid ${field}`); return value; };
const requireBoolean = (value, field) => { if (typeof value !== "boolean") throw new Error(`Missing or invalid ${field}`); return value; };
const requireSha = (value, field) => { const sha = requireString(value, field); if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error(`Invalid ${field}`); return sha.toLowerCase(); };
const requireUtc = (value, field) => { const timestamp = requireString(value, field); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp)) throw new Error(`Invalid ${field}`); return timestamp; };
const assertUniqueIdentifiers = (items, field, label) => {
  const seen = new Set();
  for (const item of items) {
    const identifier = String(item[field]);
    if (seen.has(identifier)) throw new Error(`Duplicate ${label}: ${identifier}`);
    seen.add(identifier);
  }
};
const requireWebUrl = (value, field) => {
  const url = new URL(requireString(value, field));
  if (url.protocol !== "https:" || url.origin !== WEB_ORIGIN || !url.pathname.startsWith(WEB_PREFIX)) throw new Error(`Unexpected ${field}: ${url.href}`);
  return url.href;
};

function assertAllowedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.origin !== API_ORIGIN || !API_ALLOWED_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) throw new Error(`Blocked unexpected API URL: ${url.href}`);
  return url;
}

function nextLink(header) {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match?.[2] === "next") return assertAllowedUrl(match[1]).href;
  }
  return null;
}

async function fetchJsonArray(initialUrl) {
  const items = []; let url = assertAllowedUrl(initialUrl).href; let pages = 0;
  while (url) {
    if (++pages > 100) throw new Error(`Pagination exceeded safety limit for ${initialUrl}`);
    let response = null;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      response = await fetch(url, { method: "GET", redirect: "manual", headers: {
        Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "gentle-ai-review-read-only-refresh/1",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
      }});
      if (response.status >= 300 && response.status < 400) throw new Error(`Redirect rejected for ${url}: ${response.status}`);
      if (response.ok) break;
      const retryable = response.status === 429 || response.status >= 500;
      const remaining = response.headers.get("x-ratelimit-remaining");
      const reset = response.headers.get("x-ratelimit-reset");
      if (response.status === 403 && remaining === "0") throw new Error(`GitHub API rate limit exhausted; reset=${reset || "unknown"}`);
      if (!retryable || attempt === 4) throw new Error(`GitHub API failed ${response.status} for ${url}`);
      const retryAfter = Number(response.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 750);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Expected array from ${url}`);
    items.push(...page); url = nextLink(response.headers.get("link"));
  }
  return items;
}

async function fixtureArray(name) {
  const file = path.resolve(args.fixture, `${name}.json`);
  const value = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(value)) throw new Error(`Fixture ${name} must be an array`);
  return value;
}

async function collect() {
  if (args.fixture) return {
    issues: await fixtureArray("issues"), pulls: await fixtureArray("pulls"), releases: await fixtureArray("releases"), tags: await fixtureArray("tags")
  };
  const endpoint = resource => `${API_ORIGIN}${API_PREFIX}${resource}${resource.includes("?") ? "&" : "?"}per_page=100`;
  return {
    issues: await fetchJsonArray(endpoint("issues?state=open&sort=created&direction=asc")),
    pulls: await fetchJsonArray(endpoint("pulls?state=open&sort=created&direction=asc")),
    releases: await fetchJsonArray(endpoint("releases?")),
    tags: await fetchJsonArray(endpoint("tags?"))
  };
}

function normalize(raw) {
  for (const item of raw.issues) if (Object.hasOwn(item, "pull_request") && (typeof item.pull_request !== "object" || item.pull_request === null || Array.isArray(item.pull_request))) throw new Error("Invalid issue.pull_request marker");
  const issues = raw.issues.filter(item => !Object.hasOwn(item, "pull_request")).map(item => ({
    number: requireNumber(item.number, "issue.number"), updated_at: requireUtc(item.updated_at, "issue.updated_at"), url: requireWebUrl(item.html_url, "issue.html_url")
  })).sort((a, b) => a.number - b.number);
  const pulls = raw.pulls.map(item => ({
    number: requireNumber(item.number, "pull.number"), updated_at: requireUtc(item.updated_at, "pull.updated_at"), head_sha: requireSha(item.head?.sha, "pull.head.sha"), base_ref: requireString(item.base?.ref, "pull.base.ref"), draft: requireBoolean(item.draft, "pull.draft"), url: requireWebUrl(item.html_url, "pull.html_url")
  })).sort((a, b) => a.number - b.number);
  const releases = raw.releases.map(item => ({
    id: requireNumber(item.id, "release.id"), tag: requireString(item.tag_name, "release.tag_name"), name: typeof item.name === "string" ? item.name : "", draft: requireBoolean(item.draft, "release.draft"), prerelease: requireBoolean(item.prerelease, "release.prerelease"), published_at: item.published_at === null ? null : requireUtc(item.published_at, "release.published_at"), target: requireString(item.target_commitish, "release.target_commitish"), url: requireWebUrl(item.html_url, "release.html_url")
  })).sort((a, b) => b.id - a.id);
  const tags = raw.tags.map(item => ({ name: requireString(item.name, "tag.name"), sha: requireSha(item.commit?.sha, "tag.commit.sha") }));
  assertUniqueIdentifiers(issues, "number", "normalized issue number");
  assertUniqueIdentifiers(pulls, "number", "normalized pull request number");
  assertUniqueIdentifiers(releases, "id", "normalized release ID");
  assertUniqueIdentifiers(tags, "name", "normalized tag name");
  return { issues, pulls, releases, tags };
}

function indexBy(items, field) { return new Map((items || []).map(item => [String(item[field]), item])); }
function changedKeys(previous, current, key) {
  assertUniqueIdentifiers(previous, key, `previous ${key}`);
  assertUniqueIdentifiers(current, key, `current ${key}`);
  const before = indexBy(previous, key); const after = indexBy(current, key); const created = []; const updated = []; const removed = [];
  for (const [id, item] of after) {
    if (!before.has(id)) created.push(item);
    else if (JSON.stringify(before.get(id)) !== JSON.stringify(item)) updated.push({ before: before.get(id), after: item });
  }
  for (const [id, item] of before) if (!after.has(id)) removed.push(item);
  return { new: created, updated, closed_or_no_longer_open: removed };
}

function validatePrevious(value) {
  if (value === null) return;
  if (value?.schema !== SCHEMA || value.repository !== REPOSITORY) throw new Error("Previous snapshot has unexpected schema");
  requireUtc(value.observed_at, "previous.observed_at");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requireString(value.date, "previous.date"))) throw new Error("Invalid previous.date");
  requireBoolean(value.baseline, "previous.baseline");
  if (value.source?.api_origin !== API_ORIGIN || !["fixture", "public-api"].includes(value.source?.mode) || requireBoolean(value.source?.read_only, "previous.source.read_only") !== true) throw new Error("Invalid previous.source");
  for (const field of ["open_issues", "open_pull_requests", "releases", "tags", "releases_recent", "tags_recent"]) if (!Array.isArray(value[field])) throw new Error(`Invalid previous.${field}`);
  const issueRecord = (item, field) => { requireNumber(item?.number, `${field}.number`); requireUtc(item?.updated_at, `${field}.updated_at`); requireWebUrl(item?.url, `${field}.url`); };
  const pullRecord = (item, field) => { issueRecord(item, field); requireSha(item?.head_sha, `${field}.head_sha`); requireString(item?.base_ref, `${field}.base_ref`); requireBoolean(item?.draft, `${field}.draft`); };
  const releaseRecord = (item, field) => { requireNumber(item?.id, `${field}.id`); requireString(item?.tag, `${field}.tag`); if (typeof item?.name !== "string") throw new Error(`Invalid ${field}.name`); requireBoolean(item?.draft, `${field}.draft`); requireBoolean(item?.prerelease, `${field}.prerelease`); if (item?.published_at !== null) requireUtc(item?.published_at, `${field}.published_at`); requireString(item?.target, `${field}.target`); requireWebUrl(item?.url, `${field}.url`); };
  const tagRecord = (item, field) => { requireString(item?.name, `${field}.name`); requireSha(item?.sha, `${field}.sha`); };
  value.open_issues.forEach((item, index) => issueRecord(item, `previous.open_issues[${index}]`));
  value.open_pull_requests.forEach((item, index) => pullRecord(item, `previous.open_pull_requests[${index}]`));
  value.releases.forEach((item, index) => releaseRecord(item, `previous.releases[${index}]`));
  value.tags.forEach((item, index) => tagRecord(item, `previous.tags[${index}]`));
  value.releases_recent.forEach((item, index) => releaseRecord(item, `previous.releases_recent[${index}]`));
  value.tags_recent.forEach((item, index) => tagRecord(item, `previous.tags_recent[${index}]`));
  assertUniqueIdentifiers(value.open_issues, "number", "previous issue number");
  assertUniqueIdentifiers(value.open_pull_requests, "number", "previous pull request number");
  assertUniqueIdentifiers(value.releases, "id", "previous release ID");
  assertUniqueIdentifiers(value.tags, "name", "previous tag name");
  requireNumber(value.counts?.open_issues, "previous.counts.open_issues"); requireNumber(value.counts?.open_pull_requests, "previous.counts.open_pull_requests");
  if (value.counts.open_issues !== value.open_issues.length || value.counts.open_pull_requests !== value.open_pull_requests.length) throw new Error("Previous counts do not match arrays");
  const changeValidators = { issues: issueRecord, pull_requests: pullRecord, releases: releaseRecord, tags: tagRecord };
  for (const [group, validator] of Object.entries(changeValidators)) {
    const change = value.changes?.[group];
    if (!change || !Array.isArray(change.new) || !Array.isArray(change.updated) || !Array.isArray(change.closed_or_no_longer_open)) throw new Error(`Invalid previous.changes.${group}`);
    change.new.forEach((item, index) => validator(item, `previous.changes.${group}.new[${index}]`));
    change.closed_or_no_longer_open.forEach((item, index) => validator(item, `previous.changes.${group}.closed[${index}]`));
    change.updated.forEach((item, index) => { if (!item || typeof item !== "object") throw new Error(`Invalid previous.changes.${group}.updated[${index}]`); validator(item.before, `previous.changes.${group}.updated[${index}].before`); validator(item.after, `previous.changes.${group}.updated[${index}].after`); });
  }
}

async function readPrevious(outputDir) {
  const candidate = args.previous ? path.resolve(args.previous) : path.join(outputDir, "latest.json");
  try { const value = JSON.parse(await readFile(candidate, "utf8")); validatePrevious(value); return value; }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function atomicJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  JSON.parse(await readFile(temporary, "utf8"));
  await rename(temporary, target);
}

const observedAt = args["observed-at"] || new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(observedAt)) throw new Error("observed-at must be UTC ISO seconds");
const date = args.date || observedAt.slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must be YYYY-MM-DD");
const outputDir = path.resolve(args["output-dir"] || path.join(ROOT, "data"));
const previous = await readPrevious(outputDir);
const normalized = normalize(await collect());
const core = { open_issues: normalized.issues, open_pull_requests: normalized.pulls, releases: normalized.releases, tags: normalized.tags };
const previousCore = previous ? { open_issues: previous.open_issues, open_pull_requests: previous.open_pull_requests, releases: previous.releases, tags: previous.tags } : null;
const changed = !previousCore || JSON.stringify(previousCore) !== JSON.stringify(core);
const emptyChange = () => ({ new: [], updated: [], closed_or_no_longer_open: [] });
const changes = previous ? {
  issues: changedKeys(previous.open_issues, core.open_issues, "number"),
  pull_requests: changedKeys(previous.open_pull_requests, core.open_pull_requests, "number"),
  releases: changedKeys(previous.releases, core.releases, "id"),
  tags: changedKeys(previous.tags, core.tags, "name")
} : { issues: emptyChange(), pull_requests: emptyChange(), releases: emptyChange(), tags: emptyChange() };
const snapshot = {
  schema: SCHEMA, repository: REPOSITORY, observed_at: observedAt, date, baseline: previous === null,
  source: { api_origin: API_ORIGIN, mode: args.fixture ? "fixture" : "public-api", read_only: true },
  counts: { open_issues: core.open_issues.length, open_pull_requests: core.open_pull_requests.length },
  changes, releases_recent: core.releases.slice(0, 10), tags_recent: core.tags.slice(0, 10), ...core
};
validatePrevious(snapshot);

if (changed) {
  await atomicJson(path.join(outputDir, "daily", `${date}.json`), snapshot);
  await atomicJson(path.join(outputDir, "latest.json"), snapshot);
}
const result = { changed, date, observed_at: observedAt, counts: snapshot.counts, change_counts: Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, { new: value.new.length, updated: value.updated.length, closed_or_no_longer_open: value.closed_or_no_longer_open.length }])) };
if (args["result-file"]) await atomicJson(path.resolve(args["result-file"]), result);
console.log(JSON.stringify(result, null, 2));
