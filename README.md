# gentle-ai review

Revisión comunitaria independiente del estado de release y de colas críticas de [`Gentleman-Programming/gentle-ai`](https://github.com/Gentleman-Programming/gentle-ai).

> **No oficial y no afiliada.** Este repositorio no representa al proyecto upstream ni a sus mantenedores. El estado vivo de upstream prevalece sobre cualquier snapshot publicado aquí.

## Respuesta rápida

- **RC3:** `v2.4.0-rc.3@e659f46…` permanece en **HOLD**.
- **Gates abiertos:** runtime rollback, compact-state rollback, publicación/procedencia/inmutabilidad y documentación exact-tag.
- **Mejoras cerradas:** assets/checksums disponibles y Windows exact-SHA verde.
- **Tracker:** 510 issues abiertas y 174 PR abiertos al `2026-08-10T03:54:26Z`.
- **Ejecución:** 22 candidatos de issue abiertos + #2348 cerrado; PR 6 close-now / 10 guarded / 12 DNM; siempre JIT, nunca bulk.

## Sitio

GitHub Pages previsto: <https://jnzader.github.io/gentle-ai-review/>

El sitio estático vive en [`docs/`](docs/) y no necesita build:

- [Hub](docs/index.html)
- [Briefing](docs/briefing.html)
- [Programa de remediación](docs/remediation.html)
- [Biblioteca de evidencia](docs/evidence-library.html)
- [Alcance](docs/about.html)

Para servirlo localmente:

```sh
python3 -m http.server 8000 --directory docs
```

## Reportes

1. [Resumen ejecutivo](reports/executive-summary.md)
2. [Preparación de release](reports/release-readiness.md)
3. [Estrategia de issues](reports/issue-strategy.md)
4. [Estrategia de pull requests](reports/pull-request-strategy.md)
5. [Remediación por olas](reports/remediation-waves.md)
6. [Registro de decisiones](reports/decision-register.md)
7. [Método](reports/methodology.md)
8. [Limitaciones](reports/limitations.md)

Datos curados: [`data/current-state.json`](data/current-state.json).

Controles ejecutados sobre este paquete: [VALIDATION.md](VALIDATION.md).

## Vigencia

| Boundary | Observado |
| --- | --- |
| Release/tag RC3 | `2026-08-10T03:56:19Z` |
| Estado tracker | `2026-08-10T03:54:26Z` |

`main` avanzó después del SHA validado. Este repositorio **no afirma** que todo el main posterior haya sido revisado integralmente.

## Participar

Lea [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) y [NOTICE.md](NOTICE.md). Licencia: [MIT](LICENSE).
