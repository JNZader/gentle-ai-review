# Registro de decisiones

Este documento propone decisiones; upstream conserva toda autoridad.

| ID | Decisión necesaria | Opciones | Criterio de salida | Estado |
| --- | --- | --- | --- | --- |
| D1 | Compatibilidad runtime | bump, encoding backward-readable o refusal tipada | Fixture RC1 real + restore | Pendiente |
| D2 | Compatibilidad compact | bump, negociación o encoding compatible | Compact lineage leído/rechazado de forma tipada | Pendiente |
| D3 | Publicación RC | workflow transaccional con attestation/manifest | SHA fuente verificable + final inmutable | Pendiente |
| D4 | Docs exact-tag | gate pre-publicación + smoke test | Tag instala el candidato que nombra | Pendiente |
| D5 | Autorización JIT | checklist + owner por familia | Ninguna mutación sin refresh/aceptación | Pendiente |

## Cómo cerrar una decisión

Registrar:

1. opción elegida;
2. owner y backup;
3. criterio observable;
4. evidencia enlazada;
5. tradeoff/reversión;
6. fecha UTC.

El silencio no equivale a aprobación.
