# RC3 permanece en HOLD

**Acción recomendada:** no promover `v2.4.0-rc.3` a stable. Preparar un
candidato de reemplazo que cierre cuatro gates, conservando las mejoras de
assets/checksums y Windows.

> Revisión comunitaria independiente, no oficial y no afiliada. Upstream vivo
> prevalece. Release observado `2026-08-10T03:56:19Z`; tracker observado
> `2026-08-10T03:54:26Z`.

## Estado actual

| Área | Estado | Acción |
| --- | --- | --- |
| Runtime rollback | Bloqueado | Versionar/negociar y probar RC1 real. |
| Compact-state rollback | Bloqueado | Probar RC1 contra compact state nuevo. |
| Publicación/procedencia | Bloqueado | Workflow controlado, source limpio, attestation, manifest firmado e inmutabilidad. |
| Docs exact-tag | Bloqueado | Hacer que README/quickstart RC3 instalen el candidato correcto. |
| Assets/checksums | Verde | Preservar cinco binarios y digests verificados. |
| Windows exact-SHA | Verde | Mantener el harness ACL corregido como gate nativo. |

## Tracker

- **510** issues abiertas; **174** PR abiertos.
- Issues de cierre: **22 abiertos**; **#2348 ya cerrado**.
- PR: **6 close-now**, **10 guarded-close**, **12 do-not-merge**.
- #2870 y #2891 permanecen como prioridades fail-open.
- Cada acción requiere verificación JIT; ningún listado autoriza mutación masiva.

## Boundary

La evidencia de release corresponde exactamente a
[`e659f46…`](https://github.com/Gentleman-Programming/gentle-ai/commit/e659f46be8e69c9bc8835ae1cc826cfd4d1978b6).
Release y tracker son cortes separados; el tracker es posterior solo a la
validación base de `00:58:10Z`. `main` ya había avanzado a `564b0df…`; no se
afirma que ese main posterior haya sido revisado integralmente.

## Próximo paso

1. Ratificar cuatro gates y owners.
2. Construir fixtures de rollback.
3. Ratificar política de publicación RC.
4. Corregir docs candidate-bound.
5. Ejecutar issues/PR solo con evidencia JIT.
