#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "report-catalog.json");
const publicCatalogPath = path.join(root, "docs", "data", "report-catalog.json");
const checkOnly = process.argv.includes("--check");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function validateCatalog(value) {
  if (value?.schema !== "gentle-ai-review.report-catalog/v1" || !Array.isArray(value.reports) || value.reports.length !== 8) throw new Error("Invalid report catalog schema");
  const slugs = new Set();
  for (const report of value.reports) {
    if (typeof report?.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(report.slug) || !/^[a-z0-9-]+\.md$/.test(report.file) || !report.title || !report.snapshot) throw new Error(`Invalid report catalog entry: ${JSON.stringify(report)}`);
    if (slugs.has(report.slug)) throw new Error(`Duplicate report slug: ${report.slug}`);
    slugs.add(report.slug);
  }
}

async function atomicWrite(target, bytes) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes);
  await rename(temporary, target);
}

const catalogBytes = await readFile(catalogPath);
const catalog = JSON.parse(catalogBytes);
validateCatalog(catalog);
const results = [];

for (const report of catalog.reports) {
  const canonical = path.join(root, "reports", report.file);
  const publicCopy = path.join(root, "docs", "reports", report.file);
  const sourceBytes = await readFile(canonical);
  let targetBytes = null;
  try { targetBytes = await readFile(publicCopy); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const equal = targetBytes !== null && sourceBytes.equals(targetBytes);
  if (checkOnly && !equal) throw new Error(`Report copy out of sync: ${report.file}`);
  if (!checkOnly && !equal) await atomicWrite(publicCopy, sourceBytes);
  results.push({ file: report.file, sha256: sha256(sourceBytes), equal: checkOnly ? equal : true });
}

let publicCatalog = null;
try { publicCatalog = await readFile(publicCatalogPath); } catch (error) { if (error.code !== "ENOENT") throw error; }
const catalogEqual = publicCatalog !== null && catalogBytes.equals(publicCatalog);
if (checkOnly && !catalogEqual) throw new Error("Public report catalog is out of sync");
if (!checkOnly && !catalogEqual) await atomicWrite(publicCatalogPath, catalogBytes);

console.log(JSON.stringify({ mode: checkOnly ? "check" : "sync", catalog_equal: checkOnly ? catalogEqual : true, reports: results }, null, 2));
