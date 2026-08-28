# scripts/

Scripts de mantenimiento y automatización puntual que no encajan como comando de gestión de
Django ni como target del `Makefile` (backups, migraciones de datos únicas, utilidades de
desarrollo, semillas de datos de ejemplo…).

Convenciones:

- Scripts de shell con `#!/usr/bin/env bash` y `set -euo pipefail`.
- Cada script empieza con un comentario que explica qué hace y cómo se invoca.
- Nada que maneje secretos debe imprimirlos ni versionarlos.

_(vacío de momento)_
