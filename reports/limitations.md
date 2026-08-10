# Limitaciones y vigencia

## La evidencia es temporal

- Release: `2026-08-10T03:56:19Z`.
- Tracker: `2026-08-10T03:54:26Z`.
- RC3 release reportó `immutable:false`.

Cualquier cambio posterior en tag, assets, body, checks, issue state o PR head
puede invalidar una afirmación.

## Dos scopes diferentes

La revisión de release fija el tag/SHA `e659f46…`. El refresh tracker observó
un main posterior `564b0df…` únicamente para establecer el boundary. No se
revisó integralmente el comportamiento de ese main posterior.

## Lo que este repositorio no hace

- No representa ni reemplaza mantenedores upstream.
- No autoriza cierres, merges ni promoción.
- No garantiza que un candidato sea seguro para todos los entornos.
- No constituye asesoramiento de seguridad ni garantía de software.
- No conserva un espejo completo de GitHub.

## Regla de precedencia

Si este snapshot y upstream vivo difieren, prevalece upstream. Abra una
corrección con URL pública y timestamp; no fuerce el estado vivo para que
coincida con este documento.
