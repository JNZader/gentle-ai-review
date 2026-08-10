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

## Inspección visual

Se renderizaron hub, decks, panel de detalle, biblioteca y página de alcance en:

- escritorio `1440×900`;
- presentación `1280×720`;
- móvil `390×844`.

Las capturas de control están en [`docs/previews/`](docs/previews/).

## Higiene de publicación

- no se copiaron secretos, credenciales ni datos personales innecesarios;
- no se incluyeron rutas locales ni artefactos internos de trabajo;
- las fuentes son reportes públicos previstos o URLs públicas upstream;
- no se inicializó Git ni se creó, modificó o publicó un repositorio remoto.

## Límite

La API del release observado reportó `immutable:false`. Antes de usar estas
conclusiones para actuar, repita el refresh read-only y registre nuevos
timestamps, full SHAs y cualquier drift.
