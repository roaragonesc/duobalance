# Buenas prácticas del proyecto

## Código y arquitectura

- TypeScript estricto; usa `unknown` en límites externos y evita `any`.
- Mantén features cohesivas y dependencias con una sola dirección.
- Usa paquetes compartidos solo para contratos estables consumidos por ambas
  aplicaciones; evita duplicar tipos o lógica de dominio.
- No añadas patrones, capas, carpetas vacías ni dependencias sin una necesidad
  concreta.
- Actualiza documentación y lockfile junto con cambios de arquitectura o
  dependencias.
- Consulta inventario y propietario antes de generar código. Regenera su bloque
  AST y documenta cambios de API en el mismo diff, evitando piezas duplicadas.
- Delega solo tareas independientes con archivos disjuntos y contrato de entrega;
  el coordinador conserva contratos comunes y verifica la integración.

## Web

- HTML semántico, etiquetas asociadas, foco visible y teclado como primera
  clase. UI en español de España.
- Preferir enlaces para navegación y botones para acciones.
- Manejar estados de carga, error y ausencia de datos sin fallos silenciosos.
- Mantener estados deterministas y nombres accesibles, sin esperas fijas ni
  identificadores de prueba innecesarios.
- Nunca incluir credenciales o lógica de autorización en el bundle.

## API y datos

- Validar entradas en runtime y autorizar cada operación en el servidor.
- Centralizar errores con códigos HTTP coherentes y sin trazas, tokens o
  secretos en las respuestas.
- Conservar transacciones, límites de concurrencia y privacidad financiera.
- Representar importes en céntimos enteros y no recalcular repartos históricos.
- Mantener configuración privada en `apps/api/.env`, nunca en variables
  `VITE_*`.

## Verificación

- `npm run lint:arch` (alias compatible: `pnpm run check:architecture`)
- `npm run inventory:update` al cambiar fuentes/imports/exports; revisar el diff
- `npm run test:architecture` y `npm run typecheck:tooling` al cambiar el validador
- `npm run test:unit` y `npm run typecheck:unit` para cliente/servicios HTTP
- `pnpm run lint`
- `pnpm run build`
- `pnpm run build:demo` para cambios del demo o su bootstrap
- Ejecutar pruebas unitarias de desarrollador cuando existan y estén autorizadas.
  No ejecutar suites completas ni añadir herramientas de testing por defecto.

La compilación no sustituye las pruebas de comportamiento, accesibilidad ni
verificación contra servicios reales.

## Ejemplos y límites verificables

| Práctica | Ejemplo existente | Razón |
| --- | --- | --- |
| Separar transporte y feature | `apps/web/src/services/api/http.ts` y servicios de features | Centraliza cookies, CSRF y errores sin mezclar UI y red |
| Validar en runtime | `packages/shared-schemas/index.js` | Un tipo TypeScript no comprueba JSON externo |
| Validar respuestas consumidas | `apps/web/src/services/api/contracts.ts` | Detecta payloads inválidos y protege cálculos con céntimos enteros |
| Propiedad de persistencia | `apps/api/src/repositories/` | El navegador no debe importar modelos MongoDB |
| Estados y foco accesibles | `TextField`, `FormAlert`, `ConfirmDialog` | Errores y acciones deben ser observables con teclado y lectores |
| Composición de rutas | `apps/web/src/app/router/router.tsx` | Mantiene navegación y páginas separadas de negocio |

El checker AST verifica inventario, fronteras acordadas y ciclos dentro del
[alcance documentado](ARCHITECTURE.md). No usar su resultado como certificación
de autorización, seguridad, accesibilidad, contratos semánticos o módulos fuera
del grafo. No desactivar reglas ni excluir tipos para ocultar ciclos: conservar
compatibilidad mediante APIs públicas y colocar cada contrato en su propietario.
