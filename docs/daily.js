(() => {
  "use strict";
  const root = document.querySelector("[data-daily]");
  if (!root) return;
  const status = root.querySelector("[data-daily-status]");
  const summary = root.querySelector("[data-daily-summary]");
  const changes = root.querySelector("[data-daily-changes]");
  const releases = root.querySelector("[data-daily-releases]");

  const link = (label, href) => { const anchor = document.createElement("a"); anchor.textContent = label; anchor.href = href; anchor.rel = "noopener"; return anchor; };
  const card = (value, label) => { const node = document.createElement("div"); node.className = "daily-stat"; const strong = document.createElement("strong"); strong.textContent = String(value); const span = document.createElement("span"); span.textContent = label; node.append(strong, span); return node; };
  function listSection(title, values, describe) {
    const section = document.createElement("section"); section.className = "daily-change-group"; const heading = document.createElement("h3"); heading.textContent = `${title} (${values.length})`; section.append(heading);
    if (!values.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "Sin cambios observados."; section.append(empty); return section; }
    const list = document.createElement("ul"); for (const value of values) { const item = document.createElement("li"); const description = describe(value); if (description.href) item.append(link(description.text, description.href)); else item.textContent = description.text; list.append(item); } section.append(list); return section;
  }
  const itemAfter = value => value.after || value;
  const issueDescription = value => { const item = itemAfter(value); return { text: `#${item.number}`, href: item.url }; };
  const releaseDescription = value => { const item = itemAfter(value); return { text: `${item.tag}${item.prerelease ? " · prerelease" : ""}`, href: item.url }; };
  const tagDescription = value => { const item = itemAfter(value); return { text: `${item.name} · ${item.sha.slice(0, 8)}` }; };

  async function start() {
    try {
      const response = await fetch("data/latest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 ? "Todavía no existe un refresh diario." : `HTTP ${response.status}`);
      const value = await response.json();
      if (value?.schema !== "gentle-ai-review.daily-snapshot/v1" || value.repository !== "Gentleman-Programming/gentle-ai" || !value.changes) throw new Error("Esquema diario inválido");
      status.textContent = `Observado ${value.observed_at} · solo lectura · API pública${value.baseline ? " · baseline inicial" : ""}`;
      summary.replaceChildren(card(value.counts.open_issues, "issues abiertas"), card(value.counts.open_pull_requests, "PR abiertos"), card(value.releases_recent.length, "releases recientes"), card(value.tags_recent.length, "tags recientes"));
      changes.replaceChildren();
      const groups = [
        ["Issues nuevas", value.changes.issues.new, issueDescription], ["Issues modificadas", value.changes.issues.updated, issueDescription], ["Issues que dejaron la cola abierta", value.changes.issues.closed_or_no_longer_open, issueDescription],
        ["PR nuevos", value.changes.pull_requests.new, issueDescription], ["PR modificados o con nuevo head", value.changes.pull_requests.updated, issueDescription], ["PR que dejaron la cola abierta", value.changes.pull_requests.closed_or_no_longer_open, issueDescription],
        ["Releases nuevas", value.changes.releases.new, releaseDescription], ["Releases modificadas", value.changes.releases.updated, releaseDescription], ["Releases que dejaron el índice", value.changes.releases.closed_or_no_longer_open, releaseDescription],
        ["Tags nuevos", value.changes.tags.new, tagDescription], ["Tags modificados", value.changes.tags.updated, tagDescription], ["Tags que dejaron el índice", value.changes.tags.closed_or_no_longer_open, tagDescription]
      ];
      for (const [heading, items, describe] of groups) changes.append(listSection(heading, items, describe));
      releases.replaceChildren();
      for (const release of value.releases_recent) { const item = document.createElement("li"); item.append(link(`${release.tag}${release.prerelease ? " · prerelease" : ""}`, release.url)); releases.append(item); }
    } catch (error) { status.textContent = error.message; summary.replaceChildren(); changes.replaceChildren(); }
  }
  start();
})();
