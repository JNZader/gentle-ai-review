# Estrategia de issues

## Respuesta

Procesar **22 candidatos abiertos** uno por uno. Registrar **#2348 como ya
cerrado**. Nunca ejecutar cierre masivo desde esta lista.

Snapshot tracker: `2026-08-10T03:54:26Z`.

## Candidatos abiertos

```text
#541 #653 #707 #727 #838 #1222 #1248 #1290
#1766 #1789 #1835 #1951 #1955 #2031 #2091 #2234
#2325 #2349 #2420 #2500 #2608 #2619
```

`#2348` ya estaba cerrado al validar el estado base; no es una transición nueva.

## Protocolo JIT

Para cada issue:

1. refrescar state, labels, comentarios y PR vinculados;
2. nombrar la obligación completa;
3. identificar el carrier que la preserva;
4. reproducir aceptación/fixture;
5. obtener aprobación del owner;
6. registrar razón, enlaces, timestamp y ruta de reapertura.

**Stop:** si queda una entrada, estado, plataforma, aceptación o fixture propio,
no cerrar.

## Taxonomía

- `duplicate-closable`: otro carrier preserva toda la obligación;
- `shared-root-open`: la raíz coincide, pero queda aceptación diferenciada.

## Prioridades fail-open

- [#2870](https://github.com/Gentleman-Programming/gentle-ai/issues/2870):
  sigue `shared-root-open`; PR #2889 permanece abierto.
- [#2891](https://github.com/Gentleman-Programming/gentle-ai/issues/2891):
  sigue abierto y necesita predicate/fixture de autorización propios.
