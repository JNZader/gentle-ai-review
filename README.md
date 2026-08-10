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
- [Visor local de reportes](docs/report-viewer.html#doc=executive-summary)
- [Refresh diario read-only](docs/daily.html)
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

### Visor Markdown

Los ocho reportes canónicos permanecen en `reports/`. El sitio sirve copias
idénticas desde `docs/reports/`; nunca las edite directamente.

```sh
npm run reports:sync   # copia desde reports/ y actualiza el catálogo público
npm run reports:check  # falla si alguna copia o catálogo diverge
```

El visor usa una allowlist de slugs y un parser local que escapa HTML y vuelve a
sanitizar el árbol generado. No descarga Markdown arbitrario ni usa CDN.

## Refresh diario read-only

[`daily-refresh.yml`](.github/workflows/daily-refresh.yml) consulta una vez por
día la API pública de `Gentleman-Programming/gentle-ai`. Solo lee issues/PR
abiertos, releases y tags; guarda metadatos compactos sin bodies, comentarios ni
datos personales innecesarios.

```sh
# Prueba determinista, sin red
npm run daily:test

# Refresh público local; no necesita gh CLI
npm run daily:refresh
npm run daily:render
```

El origen API y los dos paths canónicos de GitHub (nombre y repository ID) están
hardcodeados y validados. Redirects y hosts inesperados se rechazan; un error de paginación, rate limit, JSON o esquema aborta antes de
publicar un snapshot parcial. Para evitar el rate limit anónimo, el workflow
expone `github.token` como `GITHUB_TOKEN` al GET público; localmente sigue siendo
opcional. El token conserva únicamente `contents: write` sobre este repositorio
para guardar un snapshot cuando existen cambios observables. Nunca escribe
upstream.

`data/current-state.json` continúa siendo el snapshot editorial: el refresh
automático escribe exclusivamente `data/daily/`, `data/latest.json` y sus copias
servidas bajo `docs/data/`.

## Vigencia

| Boundary | Observado |
| --- | --- |
| Release/tag RC3 | `2026-08-10T03:56:19Z` |
| Estado tracker | `2026-08-10T03:54:26Z` |

`main` avanzó después del SHA validado. Este repositorio **no afirma** que todo el main posterior haya sido revisado integralmente.

## Participar

Lea [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) y [NOTICE.md](NOTICE.md). Licencia: [MIT](LICENSE).
