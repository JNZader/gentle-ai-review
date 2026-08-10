# Estrategia de pull requests

## Respuesta

Mantener tres colas separadas. El refresh no observó drift de state/head, pero
cada acción futura exige verificación JIT.

## Close-now · 6

```text
#2038 #2111 #2222 #2357 #2580 #2728
```

Refrescar full OID, checks, review, mergeability y carrier competidor.

## Guarded-close · 10

```text
#688 #765 #1059 #1070 #1939 #2041 #2077 #2342 #2596 #2812
```

Cerrar solo después de seleccionar/verificar survivor y portar trabajo único.
Survivors observados sin drift: `#1999 #2056 #2201 #2363 #2601 #2807`.

**Guarded-close no autoriza merge del candidato.**

## Do-not-merge · 12

```text
#708 #731 #740 #1500 #1946 #2112 #2343 #2529 #2724 #2862 #2868 #2883
```

La prohibición aplica al head observado. Un slice estrecho, corregido y
reautorizado puede volver. DNM no significa cierre automático.

## Protocolo survivor/port

1. inventariar aceptación y pruebas;
2. elegir una autoridad;
3. portar requisitos únicos;
4. verificar el survivor;
5. cerrar el rival con enlaces trazables.
