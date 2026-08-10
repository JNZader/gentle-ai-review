# Contribuir

Gracias por mejorar una revisión comunitaria orientada a evidencia.

## Antes de abrir un cambio

1. Verifique el estado vivo upstream sin mutarlo.
2. Incluya timestamp UTC y URL pública para cada afirmación temporal.
3. Separe evidencia exact-tag de conteos posteriores del tracker.
4. Mantenga lenguaje neutral, profesional y action-first.
5. No incluya secretos, datos personales innecesarios, material interno ni
   volcados masivos de GitHub.

## Tipos de contribución

- Corrección factual con evidencia pública.
- Mejora de accesibilidad o visualización del sitio estático.
- Actualización curada de `data/current-state.json`.
- Clarificación de límites, decisiones o stop conditions.

## Reportes servibles

Edite únicamente `reports/*.md`. Después ejecute:

```sh
npm run reports:sync
npm run reports:check
```

No edite `docs/reports/` manualmente: es una copia verificable para GitHub
Pages. Un nuevo reporte requiere una entrada allowlisted en
`data/report-catalog.json`.

## Refresh diario

- Pruebe cambios con `npm run daily:test`; el fixture no usa la red.
- No agregue endpoints configurables, métodos distintos de GET ni hosts/paths
  fuera de la allowlist canónica hardcodeada para upstream.
- No persista bodies, comentarios, emails, autores ni tokens.
- No reemplace `data/current-state.json` desde automatización.
- Un snapshot incompleto debe fallar cerrado, no publicarse parcialmente.

## Checklist

- [ ] Links públicos funcionan.
- [ ] Conteos y listas coinciden con el JSON curado.
- [ ] El cambio no implica afiliación ni autoridad oficial.
- [ ] La evidencia incluye timestamp y boundary.
- [ ] JavaScript funciona sin dependencias externas.
- [ ] `npm run reports:check` y `npm run daily:test` pasan.
- [ ] El cambio no añade una ruta de escritura hacia upstream.
