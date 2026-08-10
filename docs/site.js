(() => {
  "use strict";
  const evidence = window.EVIDENCE_DATA?.items || [];
  const byId = new Map(evidence.map(item => [item.id, item]));
  const deck = document.querySelector(".deck");
  const library = document.querySelector("[data-evidence-library]");
  let suppressDialogClose = false;
  let detailReturnFocus = null;

  const SOURCE_TITLES = Object.freeze({
    "executive-summary.md": "Resumen ejecutivo",
    "release-readiness.md": "Preparación de release",
    "issue-strategy.md": "Estrategia de issues",
    "pull-request-strategy.md": "Estrategia de pull requests",
    "remediation-waves.md": "Plan de remediación por olas",
    "decision-register.md": "Registro de decisiones",
    "methodology.md": "Método y alcance",
    "limitations.md": "Límites de la revisión"
  });

  const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
  const deckFile = deckName => deckName === "briefing" ? "briefing.html" : "remediation.html";
  const detailHash = (slide, id) => `#slide=${slide}&detail=${encodeURIComponent(id)}`;
  const sourceTitle = source => source.label || SOURCE_TITLES[source.file.split("/").pop()] || "Evidencia técnica";

  function ensureDialog() {
    let dialog = document.querySelector("dialog.detail-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "detail-dialog";
    dialog.setAttribute("aria-labelledby", "detail-title");
    dialog.setAttribute("aria-describedby", "detail-summary");
    dialog.innerHTML = `<div class="detail-shell"><header class="detail-head"><div class="detail-headline"><div><div class="chip-row" data-detail-chips></div><h2 class="detail-title" id="detail-title"></h2></div><button class="icon-button" type="button" data-dialog-close aria-label="Cerrar detalle">×</button></div></header><div class="detail-body" data-detail-body></div></div>`;
    document.body.append(dialog);
    dialog.querySelector("[data-dialog-close]").addEventListener("click", closeDetailWithHistory);
    dialog.addEventListener("cancel", event => { event.preventDefault(); closeDetailWithHistory(); });
    dialog.addEventListener("click", event => {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDetailWithHistory();
    });
    dialog.addEventListener("close", () => {
      if (!suppressDialogClose && parseHash().detail) closeDetailWithHistory();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const nodes = [...dialog.querySelectorAll("button,a,[tabindex]:not([tabindex='-1'])")].filter(node => !node.disabled);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return dialog;
  }

  function detailMarkup(item) {
    const list = values => `<ul>${(values || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`;
    const sources = item.sources.map(source => {
      const label = sourceTitle(source);
      return `<a href="${escapeHtml(source.file)}" data-source-path="${escapeHtml(source.file)}" target="_blank" rel="noopener" aria-label="Abrir ${escapeHtml(label)}">${escapeHtml(label)}</a>`;
    }).join("");
    const related = (item.related || []).filter(id => byId.has(id)).map(id => `<button type="button" class="related-button" data-open-related="${escapeHtml(id)}">${escapeHtml(byId.get(id).title)}</button>`).join("");
    const backlink = `${deckFile(item.deck)}${detailHash(item.slide,item.id)}`;
    return `<p class="detail-summary" id="detail-summary">${escapeHtml(item.summary)}</p>
      <section class="detail-section"><h3>Qué encontramos</h3>${list(item.found)}</section>
      <section class="detail-section"><h3>Por qué importa</h3><p>${escapeHtml(item.why)}</p></section>
      <section class="detail-section"><h3>Evidencia</h3>${list(item.evidence)}</section>
      <section class="detail-section"><h3>Decisión / acción</h3><p>${escapeHtml(item.action)}</p></section>
      <section class="detail-section"><h3>Stop condition</h3><p class="detail-stop">${escapeHtml(item.stop)}</p></section>
      <section class="detail-section detail-sources"><h3>Documentación técnica</h3>${sources}</section>
      ${related ? `<section class="detail-section"><h3>Relacionados</h3>${related}</section>` : ""}
      <div class="detail-actions"><button type="button" class="text-button" data-copy-link>Copiar enlace</button>${library ? `<a class="text-button" href="${backlink}">Ver en deck</a>` : `<a class="text-button" href="evidence-library.html#detail=${encodeURIComponent(item.id)}">Abrir biblioteca</a>`}</div>`;
  }

  function renderDetail(id, focus = true) {
    const item = byId.get(id);
    if (!item) return false;
    const dialog = ensureDialog();
    dialog.querySelector("#detail-title").textContent = item.title;
    dialog.querySelector("[data-detail-chips]").innerHTML = `<span class="chip">${escapeHtml(item.category)}</span><span class="chip">${escapeHtml(item.status)}</span><span class="chip">confianza ${escapeHtml(item.confidence)}</span>`;
    dialog.querySelector("[data-detail-body]").innerHTML = detailMarkup(item);
    dialog.querySelectorAll("[data-open-related]").forEach(button => button.addEventListener("click", () => openDetail(button.dataset.openRelated, true, button)));
    dialog.querySelector("[data-copy-link]").addEventListener("click", async event => {
      try { await navigator.clipboard.writeText(location.href); event.currentTarget.textContent = "Enlace copiado"; }
      catch (_) { event.currentTarget.textContent = "Copie la URL del navegador"; }
    });
    if (!dialog.open) dialog.showModal();
    if (focus) dialog.querySelector("[data-dialog-close]").focus();
    return true;
  }

  function openDetail(id, push = true, opener = null) {
    const item = byId.get(id); if (!item) return;
    if (deck && item.deck !== deck.dataset.deck) {
      suppressDialogClose = true;
      location.assign(`${deckFile(item.deck)}${detailHash(item.slide,item.id)}`);
      return;
    }
    const dialog = document.querySelector("dialog.detail-dialog");
    if (!dialog?.open && opener?.isConnected) detailReturnFocus = opener;
    if (deck && current + 1 !== item.slide) show(item.slide - 1, false, false);
    const slide = item.slide;
    const hash = library ? `#detail=${encodeURIComponent(id)}` : detailHash(slide,id);
    if (push && location.hash !== hash) history.pushState({reviewDetail:true},"",hash);
    renderDetail(id);
  }

  function closeDetailWithHistory() {
    const parsed = parseHash();
    if (!parsed.detail) { closeDialogOnly(); return; }
    if (history.state?.reviewDetail) history.back();
    else {
      const hash = deck ? `#slide=${current + 1}` : "#";
      history.replaceState(null,"",hash); closeDialogOnly();
    }
  }
  function closeDialogOnly() {
    const dialog = document.querySelector("dialog.detail-dialog");
    if (dialog?.open) { suppressDialogClose = true; dialog.close(); suppressDialogClose = false; }
    const returnFocus = detailReturnFocus; detailReturnFocus = null;
    if (returnFocus?.isConnected) queueMicrotask(() => returnFocus.focus({preventScroll:true}));
  }

  function parseHash() {
    const raw = location.hash.slice(1);
    const legacy = raw.match(/^slide-(\d+)$/);
    if (legacy) return {slide:Number(legacy[1]), detail:null};
    const params = new URLSearchParams(raw);
    return {slide:Number(params.get("slide")) || 1, detail:params.get("detail")};
  }

  // Deck runtime
  let current = 0, slides = [], touchStartX = null;
  if (deck) {
    slides = [...deck.querySelectorAll(".slide")];
    const live = document.querySelector("[data-live]"), counter = document.querySelector("[data-counter]"), progress = document.querySelector("[data-progress]");
    const controls = Object.fromEntries(["previous","next","overview","notes","theme","fullscreen","print"].map(name => [name,document.querySelector(`[data-action='${name}']`)]));
    slides.forEach((slide,index) => {
      slide.id ||= `slide-${index+1}`; slide.tabIndex=-1; slide.setAttribute("role","group"); slide.setAttribute("aria-roledescription","diapositiva"); slide.setAttribute("aria-label",`${index+1} de ${slides.length}`);
      slide.addEventListener("click", event => { if(document.body.classList.contains("overview")&&!event.target.closest("button,a,input,select,textarea,[role='button']")){setOverview(false);show(index,true,true);} });
    });
    document.querySelectorAll("[data-detail]").forEach(button => {
      button.addEventListener("click", event => { event.stopPropagation(); openDetail(button.dataset.detail,true,button); });
      if (!byId.has(button.dataset.detail)) button.setAttribute("data-invalid-detail","");
    });
    function writeSlideHash(replace=true) {
      const hash=`#slide=${current+1}`; if(location.hash!==hash) history[replace?"replaceState":"pushState"](null,"",hash);
    }
    function show(index,focus=false,writeHash=false){
      current=Math.min(Math.max(index,0),slides.length-1); const overview=document.body.classList.contains("overview");
      slides.forEach((slide,i)=>{const active=i===current;slide.classList.toggle("is-active",active);slide.setAttribute("aria-hidden",String(!overview&&!active));});
      counter.textContent=`${current+1} / ${slides.length}`;progress.style.width=`${((current+1)/slides.length)*100}%`;controls.previous.disabled=current===0;controls.next.disabled=current===slides.length-1;
      const title=slides[current].querySelector("h1,h2")?.textContent?.trim()||`Diapositiva ${current+1}`;document.title=`${title} · ${deck.dataset.deckTitle}`;live.textContent=`Diapositiva ${current+1} de ${slides.length}: ${title}`;
      if(writeHash) writeSlideHash(true); if(focus) slides[current].focus({preventScroll:true});
    }
    function setOverview(enabled){document.body.classList.toggle("overview",enabled);controls.overview.setAttribute("aria-pressed",String(enabled));slides.forEach((s,i)=>s.setAttribute("aria-hidden",String(!enabled&&i!==current)));}
    function toggleNotes(){const enabled=document.body.classList.toggle("notes-open");controls.notes.setAttribute("aria-pressed",String(enabled));}
    function toggleTheme(){const dark=document.documentElement.dataset.theme!=="dark";document.documentElement.dataset.theme=dark?"dark":"";controls.theme.setAttribute("aria-pressed",String(dark));try{localStorage.setItem("gentle-ai-review-theme",dark?"dark":"light");}catch(_){}}
    async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){}}
    controls.previous.addEventListener("click",()=>show(current-1,true,true));controls.next.addEventListener("click",()=>show(current+1,true,true));controls.overview.addEventListener("click",()=>setOverview(!document.body.classList.contains("overview")));controls.notes.addEventListener("click",toggleNotes);controls.theme.addEventListener("click",toggleTheme);controls.fullscreen.addEventListener("click",toggleFullscreen);controls.print.addEventListener("click",()=>print());
    document.addEventListener("keydown",event=>{
      if(document.querySelector("dialog[open]")||event.target.matches("input,select,textarea")||event.altKey||event.ctrlKey||event.metaKey)return;
      const key=event.key.toLowerCase();if(["arrowright","pagedown"," "].includes(key)){event.preventDefault();show(current+1,true,true);}else if(["arrowleft","pageup"].includes(key)){event.preventDefault();show(current-1,true,true);}else if(key==="home"){event.preventDefault();show(0,true,true);}else if(key==="end"){event.preventDefault();show(slides.length-1,true,true);}else if(key==="o")setOverview(!document.body.classList.contains("overview"));else if(key==="n")toggleNotes();else if(key==="t")toggleTheme();else if(key==="f")toggleFullscreen();else if(key==="p")print();
    });
    deck.addEventListener("touchstart",e=>{touchStartX=e.target.closest("button,a,input,select,textarea,[role='button']")?null:e.changedTouches[0]?.screenX??null},{passive:true});deck.addEventListener("touchend",e=>{if(touchStartX===null)return;const d=(e.changedTouches[0]?.screenX??touchStartX)-touchStartX;if(Math.abs(d)>55)show(current+(d<0?1:-1),true,true);touchStartX=null},{passive:true});
    document.addEventListener("fullscreenchange",()=>controls.fullscreen.setAttribute("aria-pressed",String(Boolean(document.fullscreenElement))));
    try{if(localStorage.getItem("gentle-ai-review-theme")==="dark")document.documentElement.dataset.theme="dark";}catch(_){} controls.theme.setAttribute("aria-pressed",String(document.documentElement.dataset.theme==="dark"));
    window.addEventListener("hashchange",syncFromHash);
    function syncFromHash(){const parsed=parseHash(),item=parsed.detail?byId.get(parsed.detail):null;if(parsed.detail&&!item){show(parsed.slide-1,false,false);closeDialogOnly();return;}if(item&&item.deck!==deck.dataset.deck){location.replace(`${deckFile(item.deck)}${detailHash(item.slide,item.id)}`);return;}const slide=item?item.slide:parsed.slide;if(item&&parsed.slide!==item.slide)history.replaceState(history.state,"",detailHash(item.slide,item.id));show(slide-1,false,false);if(item)renderDetail(item.id,true);else closeDialogOnly();}
    syncFromHash();
  }

  // Standalone evidence explorer
  if (library) {
    const grid=document.querySelector("[data-evidence-grid]"), search=document.querySelector("[data-search]"), category=document.querySelector("[data-category]"), status=document.querySelector("[data-status]"), confidence=document.querySelector("[data-confidence]"), count=document.querySelector("[data-result-count]");
    [...new Set(evidence.map(x=>x.category))].sort().forEach(value=>category.insertAdjacentHTML("beforeend",`<option>${escapeHtml(value)}</option>`));
    [...new Set(evidence.map(x=>x.status))].sort().forEach(value=>status.insertAdjacentHTML("beforeend",`<option>${escapeHtml(value)}</option>`));
    [...new Set(evidence.map(x=>x.confidence))].sort().forEach(value=>confidence.insertAdjacentHTML("beforeend",`<option>${escapeHtml(value)}</option>`));
    function renderLibrary(){const q=search.value.trim().toLowerCase();const rows=evidence.filter(item=>{const corpus=[item.id,item.title,item.summary,item.why,item.action,item.stop,...item.found,...item.evidence,...(item.related||[]),...item.sources.flatMap(source=>[source.file,source.section])].join(" ").toLowerCase();return(!q||corpus.includes(q))&&(!category.value||item.category===category.value)&&(!status.value||item.status===status.value)&&(!confidence.value||item.confidence===confidence.value)});count.textContent=`${rows.length} / ${evidence.length}`;grid.innerHTML=rows.length?rows.map(item=>`<button type="button" class="evidence-card" data-library-detail="${escapeHtml(item.id)}"><div class="chip-row"><span class="chip">${escapeHtml(item.category)}</span><span class="chip">${escapeHtml(item.status)}</span><span class="chip">conf. ${escapeHtml(item.confidence)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><span class="explore">Explorar +</span></button>`).join(""):`<div class="empty-state"><h2>Sin resultados</h2><p>Ajuste búsqueda o filtros.</p></div>`;grid.querySelectorAll("[data-library-detail]").forEach(button=>button.addEventListener("click",()=>openDetail(button.dataset.libraryDetail,true,button)));}
    [search,category,status,confidence].forEach(control=>control.addEventListener(control===search?"input":"change",renderLibrary));renderLibrary();
    window.addEventListener("hashchange",()=>{const parsed=parseHash();if(parsed.detail)renderDetail(parsed.detail,true);else closeDialogOnly();});const parsed=parseHash();if(parsed.detail)renderDetail(parsed.detail,true);
  }
})();
