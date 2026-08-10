(() => {
  "use strict";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  const safeHref = value => {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "#";
    } catch (_) { return "#"; }
  };

  function inline(source) {
    const code = [];
    let value = String(source).replace(/`([^`]+)`/g, (_, content) => `\u0000${code.push(`<code>${escapeHtml(content)}</code>`) - 1}\u0000`);
    value = escapeHtml(value)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${safeHref(href)}" rel="noopener">${label}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>")
      .replace(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)]);
    return value;
  }

  const isTableDivider = line => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const cells = line => line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());

  function render(markdown) {
    const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    for (let index = 0; index < lines.length;) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }
      const fence = line.match(/^```([a-zA-Z0-9_-]*)\s*$/);
      if (fence) {
        const body = []; index += 1;
        while (index < lines.length && !/^```\s*$/.test(lines[index])) body.push(lines[index++]);
        if (index >= lines.length) throw new Error("Unclosed Markdown fence");
        index += 1; const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
        output.push(`<pre><code${language}>${escapeHtml(body.join("\n"))}</code></pre>`); continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) { const level = heading[1].length; output.push(`<h${level}>${inline(heading[2])}</h${level}>`); index += 1; continue; }
      if (index + 1 < lines.length && line.includes("|") && isTableDivider(lines[index + 1])) {
        const headers = cells(line); index += 2; const rows = [];
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(cells(lines[index++]));
        output.push(`<div class="table-scroll"><table><thead><tr>${headers.map(value => `<th>${inline(value)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${inline(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue;
      }
      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
        output.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`); continue;
      }
      const listMatch = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
      if (listMatch) {
        const ordered = Boolean(listMatch[2]); const tag = ordered ? "ol" : "ul"; const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
          if (!item || Boolean(item[2]) !== ordered) break;
          let text = item[3]; index += 1;
          while (index < lines.length && lines[index].trim() && /^\s{2,}\S/.test(lines[index]) && !/^\s*(?:[-*+]|\d+\.)\s+/.test(lines[index])) text += ` ${lines[index++].trim()}`;
          items.push(`<li>${inline(text)}</li>`);
        }
        output.push(`<${tag}>${items.join("")}</${tag}>`); continue;
      }
      const paragraph = [line.trim()]; index += 1;
      while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+/.test(lines[index]) && !/^```/.test(lines[index]) && !/^>\s?/.test(lines[index]) && !/^\s*(?:[-*+]|\d+\.)\s+/.test(lines[index]) && !(index + 1 < lines.length && lines[index].includes("|") && isTableDivider(lines[index + 1]))) paragraph.push(lines[index++].trim());
      output.push(`<p>${inline(paragraph.join(" "))}</p>`);
    }
    return output.join("\n");
  }

  window.SafeMarkdown = Object.freeze({ render });
})();
