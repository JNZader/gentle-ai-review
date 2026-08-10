(() => {
  "use strict";
  const root = document.querySelector("[data-report-viewer]");
  if (!root) return;
  const title = root.querySelector("[data-report-title]");
  const snapshot = root.querySelector("[data-report-snapshot]");
  const article = root.querySelector("[data-report-article]");
  const status = root.querySelector("[data-report-status]");
  const previous = root.querySelector("[data-report-previous]");
  const next = root.querySelector("[data-report-next]");
  const printButton = root.querySelector("[data-report-print]");
  const github = root.querySelector("[data-report-github]");
  const allowedTags = new Set(["A","BLOCKQUOTE","CODE","DIV","EM","H1","H2","H3","H4","H5","H6","LI","OL","P","PRE","STRONG","TABLE","TBODY","TD","TH","THEAD","TR","UL"]);

  function safeFragment(html) {
    const parsed = new DOMParser().parseFromString(`<main>${html}</main>`, "text/html");
    const container = parsed.body.firstElementChild;
    for (const element of [...container.querySelectorAll("*")]) {
      if (!allowedTags.has(element.tagName)) { element.replaceWith(...element.childNodes); continue; }
      for (const attribute of [...element.attributes]) {
        const allowed = (element.tagName === "A" && ["href","rel"].includes(attribute.name)) || (element.tagName === "CODE" && attribute.name === "class") || (element.tagName === "DIV" && attribute.name === "class" && attribute.value === "table-scroll");
        if (!allowed) element.removeAttribute(attribute.name);
      }
      if (element.tagName === "A") {
        try { const url = new URL(element.getAttribute("href"), location.href); if (!["http:","https:"].includes(url.protocol)) throw new Error(); element.href = url.href; element.rel = "noopener"; }
        catch (_) { element.removeAttribute("href"); }
      }
      if (element.tagName === "CODE" && !/^language-[a-zA-Z0-9_-]+$/.test(element.className)) element.removeAttribute("class");
    }
    const fragment = document.createDocumentFragment();
    for (const child of [...container.childNodes]) fragment.append(document.importNode(child, true));
    return fragment;
  }

  let catalog = [];
  let catalogState = "loading";
  let reportRequest = null;
  let reportGeneration = 0;
  const bySlug = () => new Map(catalog.map(report => [report.slug, report]));
  const currentSlug = () => new URLSearchParams(location.hash.slice(1)).get("doc") || "executive-summary";

  function setReportControls(report = null) {
    const index = report ? catalog.indexOf(report) : -1;
    previous.disabled = index <= 0;
    previous.dataset.slug = index > 0 ? catalog[index - 1].slug : "";
    next.disabled = index < 0 || index === catalog.length - 1;
    next.dataset.slug = index >= 0 && index < catalog.length - 1 ? catalog[index + 1].slug : "";
    printButton.disabled = index < 0;
    if (index < 0) {
      github.removeAttribute("href");
      github.setAttribute("aria-disabled", "true");
      github.setAttribute("tabindex", "-1");
    } else {
      github.href = `https://github.com/JNZader/gentle-ai-review/blob/main/reports/${encodeURIComponent(report.file)}`;
      github.removeAttribute("aria-disabled");
      github.removeAttribute("tabindex");
    }
  }

  function openSlug(slug, replace = false) {
    if (catalogState !== "ready") return;
    if (!bySlug().has(slug)) slug = "executive-summary";
    const hash = `#doc=${encodeURIComponent(slug)}`;
    if (location.hash === hash) return load();
    history[replace ? "replaceState" : "pushState"]({ reportViewer: true }, "", hash);
    load();
  }

  async function load() {
    if (catalogState !== "ready") return;
    const generation = ++reportGeneration;
    reportRequest?.abort();
    const controller = new AbortController();
    reportRequest = controller;
    const report = bySlug().get(currentSlug());
    if (!report) {
      if (currentSlug() !== "executive-summary") openSlug("executive-summary", true);
      else {
        status.textContent = "Visor no disponible: el catálogo no contiene el reporte inicial.";
        setReportControls();
      }
      return;
    }
    status.textContent = "Cargando reporte…";
    setReportControls();
    article.replaceChildren();
    try {
      const response = await fetch(`reports/${report.file}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      if (generation !== reportGeneration || controller.signal.aborted || currentSlug() !== report.slug) return;
      article.replaceChildren(safeFragment(window.SafeMarkdown.render(markdown)));
      title.textContent = report.title;
      snapshot.textContent = report.snapshot;
      document.title = `${report.title} · gentle-ai review`;
      const index = catalog.indexOf(report);
      setReportControls(report);
      status.textContent = `Reporte ${index + 1} de ${catalog.length}`;
      article.querySelector("h1,h2")?.setAttribute("tabindex", "-1");
      article.querySelector("h1,h2")?.focus({ preventScroll: true });
    } catch (error) {
      if (error.name === "AbortError" || generation !== reportGeneration) return;
      status.textContent = "No se pudo cargar el reporte.";
      setReportControls();
      const message = document.createElement("p"); message.className = "report-error"; message.textContent = `Error de lectura: ${error.message}`; article.replaceChildren(message);
    } finally { if (generation === reportGeneration) reportRequest = null; }
  }

  async function start() {
    try {
      const response = await fetch("data/report-catalog.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const value = await response.json();
      if (value?.schema !== "gentle-ai-review.report-catalog/v1" || !Array.isArray(value.reports) || value.reports.length !== 8) throw new Error("Catálogo inválido");
      catalog = value.reports.filter(report => typeof report?.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(report.slug) && /^[a-z0-9-]+\.md$/.test(report.file));
      if (catalog.length !== 8) throw new Error("Allowlist incompleta");
      catalogState = "ready";
      await load();
    } catch (error) {
      catalogState = "error";
      setReportControls();
      title.textContent = "Visor no disponible";
      snapshot.textContent = "";
      status.textContent = `Visor no disponible: ${error.message}`;
      const message = document.createElement("p"); message.className = "report-error"; message.textContent = "No se pudo cargar el catálogo de reportes. Volvé al inicio e intentá nuevamente más tarde."; article.replaceChildren(message);
    }
  }

  root.querySelector("[data-report-back]").addEventListener("click", () => history.length > 1 ? history.back() : location.assign("index.html"));
  previous.addEventListener("click", () => openSlug(previous.dataset.slug));
  next.addEventListener("click", () => openSlug(next.dataset.slug));
  printButton.addEventListener("click", () => print());
  window.addEventListener("hashchange", load);
  document.addEventListener("keydown", event => { if (event.key === "Escape") history.length > 1 ? history.back() : location.assign("index.html"); });
  setReportControls();
  start();
})();
