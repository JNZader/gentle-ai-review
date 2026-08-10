# Método

## Propósito

Producir una revisión comunitaria reproducible y de bajo riesgo usando solo
metadatos y evidencia pública, sin mutar upstream.

## Boundaries

- **Release exact-tag:** `v2.4.0-rc.3@e659f46…`, observado
  `2026-08-10T03:56:19Z`.
- **Tracker vivo:** conteos, estados y heads específicos, observado
  `2026-08-10T03:54:26Z`.

Los boundaries se reportan por separado. El main posterior no hereda
conclusiones exact-tag.

## Técnicas

- lectura de refs, release API, workflow/check runs y archivos exact-SHA;
- descarga y verificación de assets/checksums;
- inspección de `go version -m` de los cinco ejecutables;
- refresh read-only de state y full OID para colas curadas;
- normalización de resultados en `data/current-state.json`;
- links a evidencia pública upstream.

## No realizado

- No se ejecutaron builds, installers ni workflows.
- No se modificaron issues, PR, labels, refs, releases ni código upstream.
- No se copió un volcado masivo del tracker.
- No se recolectaron datos personales innecesarios.

## Reproducibilidad

Una actualización debe registrar UTC, SHA/tag, URLs consultadas, listas exactas
y cualquier drift. Si el release mutable o un head cambia, la afirmación
correspondiente expira hasta un nuevo refresh.
