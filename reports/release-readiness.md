# Preparación de release: v2.4.0-rc.3

## Veredicto

**HOLD.** El candidato exacto es
[`v2.4.0-rc.3@e659f46…`](https://github.com/Gentleman-Programming/gentle-ai/commit/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6),
observado a `2026-08-10T03:56:19Z`.

## Cuatro gates abiertos

### 1. Runtime rollback

RC3 mantiene semántica nueva (`objective/repair-consecutive-rescope`, `repair`)
bajo `gentle-ai.sdd-runtime-record/v1`. El decoder RC1 no conoce esa forma.
[Writer exact-tag](https://github.com/Gentleman-Programming/gentle-ai/blob/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6/internal/sddstatus/runtime_ledger.go#L23-L43).

**Salida:** versionado o encoding backward-readable, fixture producido por el
reemplazo, binario RC1 real, resultado tipado, bytes preservados y ruta de
restauración.

### 2. Compact-state rollback

RC3 persiste `correction_budget_policy:"floor_two"` bajo
`gentle-ai.review-state/v2`; RC1 lo rechaza por allowlist estricta.
[Store exact-tag](https://github.com/Gentleman-Programming/gentle-ai/blob/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6/internal/reviewtransaction/compact.go#L18-L35).

**Salida:** mismo estándar de downgrade sobre un lineage compacto ordinario.

### 3. Publicación, procedencia e inmutabilidad

La disponibilidad mejoró, pero la frontera sigue abierta:

- [`release.yml`](https://github.com/Gentleman-Programming/gentle-ai/blob/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6/.github/workflows/release.yml#L3-L10)
  no cubrió RC3;
- no hubo workflow de release del repositorio;
- no hay manifest firmado;
- la API reporta `immutable:false`;
- todos los binarios reportan `(devel)`, `vcs.modified=true` y ninguna
  `vcs.revision`.

Los checksums prueban integridad de descarga, no identidad fuente.

**Salida:** source limpio → exact-SHA CI → build → attestation/manifest firmado
→ publicación atómica → verificación pública → finalización inmutable.

### 4. Docs exact-tag

El [`README`](https://github.com/Gentleman-Programming/gentle-ai/blob/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6/README.md#L29-L32)
y [`quickstart`](https://github.com/Gentleman-Programming/gentle-ai/blob/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6/docs/quickstart.md#L55-L78)
del tag RC3 todavía nombran e instalan RC1.

**Salida:** el árbol exact-tag debe nombrar e instalar el mismo candidato, y el
comando debe probarse desde un entorno limpio.

## Mejoras cerradas

### Assets y checksums

Cinco binarios y `SHA256SUMS.txt` están disponibles. Todas las entradas del
manifest verifican y coinciden con los digests de assets.

### Windows exact-SHA

El harness dejó de depender del módulo ACL opcional y el
[job sucesor](https://github.com/Gentleman-Programming/gentle-ai/actions/runs/31341774049)
está verde. Esto cierra una deuda de evidencia; no cambia los writers durables.

## Stop conditions

HOLD continúa hasta que un único candidato cierre 4/4 gates y preserve ambas
mejoras. Después de publicar, releer tag, SHA, assets, digests, runs, docs,
timestamps e inmutabilidad.
