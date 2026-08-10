# Validación del paquete público

## Resultado

Los controles locales terminaron sin errores. Esto prueba consistencia interna
del paquete y fidelidad al snapshot curado; no reemplaza un refresh del estado
vivo upstream.

## Consistencia factual

- timestamps separados de release y tracker: exactos;
- candidato y full SHA RC3: exactos;
- veredicto HOLD y cuatro gates: exactos;
- conteos 510 issues / 174 PR: exactos;
- 22 candidatos de issue abiertos y #2348 cerrado: exactos;
- colas PR 6 close-now / 10 guarded / 12 DNM: listas exactas;
- seis assets, incluidos cinco binarios y checksums: digests verificados;
- Windows exact-SHA: conservado como mejora verde;
- boundary entre exact-tag RC3 y main posterior: visible.

## Integridad del sitio

- `docs/site.js` y `docs/evidence-data.js` pasan parseo JavaScript;
- 35 evidencias tienen ID único, fuente, relaciones válidas y slide canónica;
- cada trigger de detalle resuelve y cada evidencia canónica tiene trigger;
- briefing: 12 slides y 12 notas;
- remediación: 14 slides y 14 notas;
- todos los links locales de los HTML resuelven;
- el sitio funciona sin build ni dependencias remotas de runtime.

## Visor y sincronización de reportes

- `node scripts/sync-reports.mjs --check` verifica catálogo y ocho copias;
- cada `reports/*.md` coincide byte por byte y por SHA-256 con
  `docs/reports/*.md`;
- los ocho deep links `report-viewer.html#doc=<slug>` cargan desde una allowlist;
- HTML crudo del Markdown se escapa y el resultado pasa por sanitización con
  allowlist de elementos/atributos/protocolos;
- Back, Escape, anterior/siguiente, foco, print y fuente GitHub se prueban en el
  navegador.

## Refresh diario

- `node scripts/test-daily-fixture.mjs` prueba new/updated/closed para issues y
  PR, además de cambios en releases y tags sin red;
- el cliente permite únicamente GET hacia el host/path upstream hardcodeado;
- redirects, respuesta no-array, campos requeridos ausentes, booleans no
  booleanos y snapshots previos corruptos/incompletos fallan cerrado antes del
  diff;
- las escrituras son atómicas y ocurren solo después de validar todas las
  páginas;
- `data/current-state.json` no forma parte de las rutas de escritura del job;
- el workflow expone `github.token` para GET autenticados, manteniendo solo
  `contents: write` sobre este repositorio;
- la página diaria usa nodos DOM y `textContent`, renderiza el delta completo e
  incluye también releases/tags que dejaron el índice;
- el visor aborta la carga anterior y usa una generación de request para evitar
  que una respuesta tardía reemplace el hash actual.

Comandos de control:

```sh
node --check scripts/*.mjs
node --check docs/*.js
node scripts/sync-reports.mjs --check
node scripts/test-daily-fixture.mjs
git diff --check
```

### Última ejecución local

- todos los scripts Node y browser JS pasaron `node --check`;
- los ocho reportes cargaron por deep link, sin error, con foco en el heading;
- un slug no allowlisted fue reemplazado por `executive-summary` sin fetch
  arbitrario;
- Back y Escape regresaron del segundo reporte al primero; anterior/siguiente
  resolvieron los slugs esperados;
- el parser cubrió headings, párrafos, blockquotes, listas ordenadas/no
  ordenadas, tablas, enlaces, énfasis, inline code y fences; un `<img onerror>`
  de prueba se renderizó como texto escapado;
- el fixture produjo, para issues/PR/releases/tags, `1 new + 1 updated + 1
  closed_or_no_longer_open`; una segunda ejecución idéntica produjo cero
  escrituras;
- el fixture rechazó tanto un snapshot previo con `draft:"false"` como una
  respuesta API con ese boolean mal tipado, sin escribir salida parcial;
- el baseline read-only inicial quedó observado `2026-08-10T04:51:42Z` con
  512 issues y 174 PR abiertos. Es un corte diario separado: no reemplaza los
  510/174 del snapshot editorial `data/current-state.json`.

## Inspección visual

Se renderizaron hub, decks, panel de detalle, biblioteca, visor Markdown, página
diaria y página de alcance en:

- escritorio `1440×900`;
- presentación `1280×720`;
- móvil `390×844`.

Las capturas de control están en [`docs/previews/`](docs/previews/).

Mediciones nuevas:

- visor móvil: viewport `390×844`, client/scroll width `378/378`;
- visor desktop: viewport `1440×900`, client/scroll width `1428/1428`;
- daily móvil: viewport `390×844`, client/scroll width `378/378`;
- daily desktop: viewport `1440×900`, client/scroll width `1428/1428`.

## Higiene de publicación

- no se copiaron secretos, credenciales ni datos personales innecesarios;
- no se incluyeron rutas locales ni artefactos internos de trabajo;
- las fuentes son reportes públicos previstos o URLs públicas upstream;
- no se modificó ni publicó el repositorio remoto durante esta implementación;
- el refresh no conserva bodies/comentarios, PII innecesaria ni tokens;
- el workflow no solicita permisos de issues o pull requests y nunca escribe en
  el repositorio upstream.

## Límite

La API del release observado reportó `immutable:false`. Antes de usar estas
conclusiones para actuar, repita el refresh read-only y registre nuevos
timestamps, full SHAs y cualquier drift.
