# Remediación por olas

## Cómo leer este plan

Este programa separa tres cosas que no deben confundirse:

1. **hecho observado:** evidencia comprobada en el snapshot;
2. **hipótesis de remediación:** cambio propuesto que todavía debe implementarse;
3. **prueba de salida:** evidencia nueva que hace falta antes de avanzar.

Por eso una ola no se declara completa porque exista código o un check verde.
Termina únicamente cuando cumple su definición de salida con evidencia del mismo
candidato. El estado vivo de upstream prevalece sobre este plan.

## Objetivo y reglas invariantes

El objetivo es reemplazar RC3 por un candidato que cierre los cuatro gates,
conserve assets/checksums y Windows exact-SHA verdes, y permita sanear el tracker
sin perder obligaciones.

Reglas que aplican a todas las olas:

- mantener **HOLD** hasta obtener 4/4 gates cerrados en un único candidato;
- no trasladar conclusiones de `v2.4.0-rc.3@e659f46…` a un `main` posterior;
- refrescar estado y SHA justo antes de toda mutación en GitHub;
- preservar bytes, aceptación, fixtures y plataformas antes de retirar un carrier;
- registrar owner, timestamp UTC, evidencia y reversión;
- detener la ejecución ante drift, autoridad ambigua o prueba incompleta;
- tratar assets y Windows verdes como invariantes que no deben retroceder.

## P0 — Freeze y control operacional

### Qué está comprobado

- RC3 continúa en **HOLD** con cuatro gates abiertos.
- El tracker observado contiene 510 issues y 174 PR abiertos.
- Las listas curadas son snapshots, no autorizaciones de cierre o merge.
- El release era mutable; por ello cualquier cambio posterior exige refresh.

### Por qué esta ola va primero

Sin una congelación explícita, una promoción o un cierre masivo puede convertir
un problema reversible en pérdida de estado, procedencia u obligaciones. P0 no
arregla el producto: evita que cambie la base mientras se decide cómo arreglarlo.

### Ejecución paso a paso

1. Publicar el SHA exacto, timestamps y veredicto HOLD.
2. Nombrar un owner y backup para cada gate y para cada familia de tracker.
3. Abrir un registro de decisiones con criterio observable, no aprobación tácita.
4. Bloquear promoción estable, cierres masivos y merges de heads DNM observados.
5. Permitir únicamente investigación read-only, fixtures, pruebas aisladas y
   documentación preparatoria que no publique nueva autoridad.
6. Registrar cualquier drift de tag, release, asset, issue, PR o head.

### Cómo comprobar la salida

- los cuatro gates y sus owners son visibles;
- todas las stop conditions están escritas;
- las listas de issues/PR tienen timestamp y boundary;
- no existe automatismo que convierta el snapshot en una mutación bulk.

### Stop conditions

- falta owner o backup para un gate;
- el release/tag cambió sin refresh;
- se propone promover por tener assets o Windows verdes solamente;
- una acción depende de interpretar silencio como aprobación.

**Exit:** decisiones, owners, gates, boundaries y stop conditions publicados.

## P1A — Compatibilidad de runtime rollback

### Qué está comprobado

RC3 escribe semántica nueva (`objective/repair-consecutive-rescope` y `repair`)
bajo `gentle-ai.sdd-runtime-record/v1`. El decoder RC1 no conoce esa forma. El
problema no es teórico: el mismo identificador de versión describe una forma que
el lector anterior no puede interpretar.

### Riesgo que elimina

Un rollback del binario puede dejar al runtime incapaz de leer estado durable
creado por el candidato nuevo. Si además se reescribe o descarta el registro, se
puede perder evidencia necesaria para restaurar o continuar.

### Decisión técnica requerida

Elegir explícitamente una de estas familias y documentar el tradeoff:

- aumentar la versión y devolver rechazo tipado preservando bytes;
- negociar capacidades/versiones entre writer y reader;
- usar un encoding que RC1 pueda leer sin perder significado esencial.

La decisión no puede basarse solo en que el lector nuevo acepte datos viejos:
eso prueba upgrade, no downgrade.

### Ejecución paso a paso

1. Construir un fixture representativo con el writer del candidato sustituto.
2. Conservar copia byte-a-byte y hash del fixture antes de leerlo.
3. Ejecutar el binario RC1 real, no un decoder reimplementado en tests nuevos.
4. Verificar que el resultado sea legible o un rechazo estable y tipado.
5. Confirmar que el intento no trunca, normaliza ni sobrescribe los bytes.
6. Ejecutar la ruta documentada de restore/recovery.
7. Volver a abrir con el candidato nuevo y confirmar continuidad semántica.
8. Repetir para estado vacío, estado ordinario y la forma nueva que causó el gate.

### Matriz mínima de prueba

| Writer | Reader | Resultado exigido |
| --- | --- | --- |
| RC1 | candidato | lectura compatible de estado previo |
| candidato | candidato | lectura completa de semántica nueva |
| candidato | RC1 | lectura compatible o rechazo tipado y no destructivo |
| candidato tras intento RC1 | candidato | bytes/estado recuperables |

### Stop conditions

- la prueba usa solo librerías nuevas y no el binario RC1;
- el error es texto libre no clasificable;
- el lector anterior modifica el archivo al fallar;
- no existe restore ejecutable;
- se valida únicamente forward replay.

**Exit:** downgrade real demostrado con RC1, resultado tipado, bytes preservados
y restore ejecutable.

## P1B — Compatibilidad de compact-state rollback

### Qué está comprobado

RC3 persiste `correction_budget_policy:"floor_two"` bajo
`gentle-ai.review-state/v2`. RC1 aplica una allowlist estricta y rechaza ese valor.
Este gate es independiente del runtime record: arreglar P1A no corrige el store
compacto automáticamente.

### Riesgo que elimina

Un downgrade puede quedar bloqueado por un snapshot compacto ordinario aunque el
ledger principal sea recuperable. Si el compact state es autoridad para reanudar,
su incompatibilidad impide una restauración operacional completa.

### Ejecución paso a paso

1. Identificar writers y readers exactos del compact state.
2. Crear un lineage ordinario que produzca `correction_budget_policy` nuevo.
3. Capturar bytes y hash del snapshot compacto.
4. Ejecutar RC1 contra ese lineage.
5. Exigir lectura compatible o rechazo tipado, explícito y no destructivo.
6. Ejecutar recuperación sin borrar el historial necesario.
7. Reabrir con el candidato y comprobar que budget, correcciones y continuidad
   no cambiaron silenciosamente.
8. Probar ausencia del campo, valor antiguo, valor nuevo y valor desconocido.

### Por qué se ejecuta en paralelo con P1A

Comparten el objetivo de downgrade, pero tienen formatos y autoridades distintas.
Pueden investigarse en paralelo; sus decisiones deben reconciliarse antes de
declarar compatibilidad global para evitar dos políticas de versionado incoherentes.

### Stop conditions

- se prueba un fixture sintético que no pasa por el writer real;
- se resuelve eliminando el campo sin demostrar equivalencia;
- el downgrade funciona solo después de borrar compact state;
- una política desconocida cae silenciosamente a un default.

**Exit:** lineage compacto real leído de forma compatible o rechazado de forma
tipada y recuperable, con semántica preservada.

## P2 — Publicación verificable y finalización inmutable

### Qué está comprobado

- Los cinco binarios y `SHA256SUMS.txt` existen y los digests verifican.
- Esa mejora demuestra integridad de descarga, no identidad de código fuente.
- No se observó un run de `release.yml` del repositorio que publicara RC3.
- No hay manifest firmado que vincule artefactos con el SHA RC3.
- Todos los binarios reportan `(devel)`, `vcs.modified=true` y ninguna
  `vcs.revision`.
- La API del release reportó `immutable:false`.

### Riesgo que elimina

Hoy un consumidor puede comprobar que descargó ciertos bytes, pero no demostrar
que esos bytes fueron construidos desde el commit candidato por un proceso
controlado, limpio y no modificable después de la verificación.

### Ejecución paso a paso

1. Disparar la publicación desde un ref exacto y resolverlo a full SHA.
2. Verificar source tree limpio y bloquear inputs no fijados.
3. Ejecutar pruebas Linux/macOS/Windows contra ese mismo SHA.
4. Construir todos los assets una sola vez dentro del workflow controlado.
5. Inspeccionar metadata embebida y rechazar `(devel)`, `vcs.modified=true` o
   ausencia de revision para el artefacto de release.
6. Generar checksums desde los bytes que serán publicados.
7. Generar attestation/manifest firmado que incluya SHA fuente, digests,
   plataforma, herramienta y run productor.
8. Crear un draft; subir exactamente los bytes attestados.
9. Descargar desde el draft y volver a verificar digest, manifest y metadata.
10. Publicar solo después de que los cuatro gates del candidato sean verdes.
11. Finalizar el release como inmutable y comprobar el estado por API.
12. Registrar enlaces al run, manifest, tag, SHA, assets y verificación final.

### Comprobación negativa necesaria

La pipeline debe fallar si cambia un byte, el tag resuelve a otro SHA, falta una
plataforma, la metadata indica dirty/devel, el manifest no valida o el release
continúa mutable.

### Stop conditions

- se reutiliza un asset construido fuera del run;
- checksums y manifest se generan desde bytes distintos de los publicados;
- el tag se mueve entre build y publicación;
- se acepta “display version” como vínculo con el commit;
- la finalización inmutable no puede comprobarse públicamente.

**Exit:** cada asset queda verificablemente unido al full SHA del candidato y
el release final se observa inmutable.

## P3 — Documentación ligada al candidato

### Qué está comprobado

En el árbol exact-tag RC3, README y quickstart todavía nombran o instalan RC1.
Por eso el release body o la documentación posterior en `main` no corrigen el
gate del tag observado.

### Riesgo que elimina

Una persona puede leer “RC3” y ejecutar un comando que instala RC1. Eso rompe la
reproducibilidad, contamina reportes de prueba y puede ocultar o fabricar fallos.

### Ejecución paso a paso

1. Definir una única variable/fuente para la versión candidata.
2. Actualizar README, quickstart y release body desde esa fuente.
3. Buscar referencias stale a candidatos anteriores en el árbol a etiquetar.
4. Crear un entorno limpio sin cache del binario.
5. Copiar literalmente el comando documentado y ejecutarlo.
6. Verificar artefacto, versión, SHA/metadata y plataforma esperada.
7. Probar links de descarga y checksums desde la documentación exact-tag.
8. Hacer que el gate de publicación falle si docs, tag y comando divergen.

### Stop conditions

- la prueba usa instrucciones distintas a las publicadas;
- la corrección existe solo en `main`, no en el tag candidato;
- el comando resuelve “latest” o un ref móvil;
- el smoke test reutiliza cache y no demuestra instalación limpia.

**Exit:** tag, texto, links y comando nombran e instalan el mismo candidato
desde limpio.

## Punto de integración — nuevo candidato

P1A, P1B, P2 y P3 deben converger sobre un único full SHA. Antes de crear el
candidato:

1. reconciliar decisiones de versionado de ambos stores;
2. ejecutar suites de downgrade y restore;
3. confirmar que Windows exact-SHA continúa verde;
4. ejecutar publicación verificable en draft;
5. ejecutar smoke test de docs contra esos mismos assets;
6. revisar 4/4 gates y recién entonces decidir publicación/finalización.

Un gate verde en otro commit no puede combinarse con tres gates verdes del
candidato actual.

## P4 — Issues con autorización JIT

### Qué está comprobado

El snapshot contiene 22 candidatos todavía abiertos y #2348 ya cerrado. #2870
y #2891 siguen abiertos como prioridades fail-open. El análisis no autoriza
cerrar ninguno en lote.

### Ejecución paso a paso por issue

1. Refrescar state, labels, comentarios, relaciones y PR vinculados.
2. Confirmar que el item sigue siendo el mismo problema; si cambió, detener.
3. Escribir la obligación completa: entrada, plataforma, resultado y aceptación.
4. Clasificar como `duplicate-closable` o `shared-root-open`.
5. Identificar el carrier que preserva **toda** la obligación.
6. Reproducir aceptación/fixture diferenciador.
7. Obtener aprobación explícita del owner de la familia.
8. Mutar un solo issue.
9. Registrar razón, carrier, evidencia, timestamp y ruta de reapertura.
10. Refrescar el tracker antes de pasar al siguiente item.

### Casos fail-open

- **#2870:** mantener abierto mientras la raíz sea compartida y #2889 continúe
  siendo parte de la obligación observable.
- **#2891:** mantener abierto hasta contar con predicate y fixture propios de
  autorización; similitud temática no basta.

### Stop conditions

- falta una entrada, estado, plataforma, fixture o aceptación propia;
- el carrier está cerrado, cambia de head o no contiene toda la obligación;
- la clasificación depende solo de título/labels;
- se intenta reutilizar una aprobación para varios issues.

**Exit:** cada mutación tiene refresh, aceptación, carrier vivo, owner, comentario
trazable y reversión; los restantes quedan explícitamente abiertos.

## P5 — Pull requests por colas

### Qué está comprobado

El refresh no detectó drift de estado o head en las listas curadas, pero esa
observación expira antes de una acción futura. Las colas cumplen propósitos
distintos y no deben mezclarse:

- **close-now (6):** `#2038 #2111 #2222 #2357 #2580 #2728`;
- **guarded-close (10):** `#688 #765 #1059 #1070 #1939 #2041 #2077 #2342
  #2596 #2812`;
- **DNM (12):** `#708 #731 #740 #1500 #1946 #2112 #2343 #2529 #2724 #2862
  #2868 #2883`.

### Protocolo común

1. Refrescar full head OID, state, checks, review y mergeability.
2. Inventariar código, tests, fixtures, docs y aceptación única.
3. Identificar dependencias y autoridad durable afectada.
4. Aplicar el protocolo específico de la cola.
5. Verificar que ninguna obligación quede sin carrier.
6. Registrar acción y volver a refrescar antes del siguiente PR.

### Close-now

Comprobar que un carrier competidor conserva todo el valor y que no hubo commits
nuevos. Solo entonces cerrar con enlaces. “Close-now” significa alta confianza
del snapshot, no permiso permanente ni merge.

### Guarded-close

Seleccionar y verificar un survivor; portar primero cualquier trabajo único;
revalidar el survivor y después cerrar el rival. Survivors observados:
`#1999 #2056 #2201 #2363 #2601 #2807`. Esta categoría **no autoriza merge** del
PR candidato ni presume que un survivor abierto ya esté completo.

### Do-not-merge

No fusionar el head observado. Evaluar si existe un slice estrecho y seguro que
pueda reaparecer con nuevo head, pruebas y autorización. DNM tampoco ordena
cierre automático: puede conservar investigación o aceptación útil.

### Stop conditions

- el head OID cambió;
- checks/reviews/mergeability ya no coinciden con el snapshot;
- el port se declara por diff visual sin ejecutar aceptación;
- el survivor concentra autoridad incompatible;
- se transforma DNM en descarte de obligaciones.

**Exit:** cada cierre o supervivencia queda respaldado por carrier verificado;
ninguna obligación queda huérfana.

## P6 — Autoridad durable y carriers

### Problema que resuelve

P4/P5 pueden fallar aunque cada item parezca correcto si dos writers siguen
publicando el mismo estado durable o si se retira el único carrier de una regla.
P6 trata la arquitectura transversal, no un número concreto de GitHub.

### Ejecución paso a paso

1. Mapear por familia: writer, reader, formato, owner, tests y consumidores.
2. Identificar siblings que compiten por la misma autoridad.
3. Elegir una autoridad canónica y documentar por qué.
4. Inventariar requisitos únicos de cada sibling.
5. Portar requisitos y fixtures al survivor antes de retirar nada.
6. Ejecutar compatibilidad, regresión y recovery sobre el survivor.
7. Serializar cambios que toquen la misma autoridad durable.
8. Retirar el sibling únicamente cuando el inventario llegue a cero.

### Comprobación de salida

- una sola autoridad escribe cada familia;
- lectores y versionado son explícitos;
- todos los requisitos tienen carrier y owner;
- rollback/recovery permanecen ejecutables;
- no hay dos migraciones concurrentes sobre el mismo formato.

### Stop conditions

- no se puede nombrar la autoridad canónica;
- un requisito solo existe en comentarios del PR que se cerrará;
- dos writers se habilitan simultáneamente;
- el port cambia semántica sin nueva aceptación.

**Exit:** una autoridad verificable por familia, con carriers y responsabilidades
no ambiguos.

## P7 — Lanes seguros y paralelismo controlado

### Qué puede correr en paralelo

- documentación preparatoria que todavía no publica un tag;
- creación de fixtures y tests que no mutan autoridad;
- discovery read-only de issues, PR, formatos y dependencias;
- verificación de Windows exact-SHA;
- inspección de links, metadata y scripts de smoke test.

### Qué debe permanecer serializado

- publicación/finalización de release;
- migraciones del mismo formato durable;
- selección y retiro de carriers competidores;
- cierres o merges que dependan de la misma obligación;
- cualquier paso que cambie tag, assets o autoridad canónica.

### Ejecución paso a paso

1. Declarar inputs, outputs y autoridad tocada por cada lane.
2. Probar que dos lanes no escriben el mismo estado ni dependen del output
   incompleto del otro.
3. Fijar SHA y fixtures comunes.
4. Ejecutar los lanes independientes.
5. Reunir resultados en un gate de integración serial.
6. Repetir Windows exact-SHA y checks compartidos tras integrar.

### Stop conditions

- un lane publica o muta autoridad sin coordinación;
- dos lanes usan SHAs distintos como si fueran el mismo candidato;
- un resultado parcial se presenta como gate completo;
- Windows deja de estar verde o se ejecuta sobre otro SHA.

**Exit:** paralelismo solo donde la independencia es demostrable y todas las
salidas convergen en el mismo candidato.

## Orden de dependencia y razonamiento

```text
P0
├── P1A ─┐
├── P1B ─┼── integración de candidato ── P2/P3 finales ── refresh 4/4
├── P4 (JIT, con freeze)
├── P5 (por cola, con freeze)
└── P7 (solo trabajo independiente)

P6 serializa las decisiones de carrier/autoridad que emergen de P1, P4 y P5.
```

- P0 precede todo porque fija autoridad y límites.
- P1A/P1B pueden investigarse en paralelo, pero deben reconciliarse.
- P2 y P3 pueden prepararse antes; su prueba final requiere el mismo candidato.
- P4/P5 avanzan JIT sin esperar la promoción, siempre que no toquen un carrier
  necesario para los gates.
- P6 manda sobre el orden cuando dos acciones comparten autoridad durable.
- P7 habilita velocidad sin convertir independencia supuesta en carrera real.

## Verificación final y criterio de promoción

Después de publicar el candidato sustituto, hacer un refresh desde cero:

1. resolver tag a full SHA;
2. comprobar 4/4 gates sobre ese SHA;
3. releer README/quickstart exact-tag;
4. descargar todos los assets y verificar digests/manifest;
5. inspeccionar metadata de cada binario;
6. verificar runs Linux/macOS/Windows del mismo SHA;
7. confirmar API y finalización inmutable;
8. registrar nuevos timestamps y drift del tracker;
9. comprobar que cierres/ports preservaron obligaciones;
10. emitir una decisión explícita de promover o mantener HOLD.

La promoción solo es defendible si todas esas comprobaciones coinciden en un
único candidato. Una mejora parcial cambia el progreso, no el veredicto.
