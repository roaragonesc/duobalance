# DuoBalance — Instrucciones para GitHub Copilot

## Contexto del proyecto
DuoBalance es una PWA para gestionar gastos compartidos entre dos personas, desarrollada bajo la marca Órbita Nexo.

Tecnologías: React, TypeScript, Vite y Tailwind CSS v4 en `apps/web`; Express,
TypeScript y MongoDB en `apps/api`. El repositorio usa pnpm workspaces y comparte
fixtures ficticios en `shared/`. El único backend es la API Node/MongoDB.
Las pruebas de desarrollador unitarias y de tooling pueden vivir aquí.

## Gobierno del repositorio

El punto de entrada del equipo es [AGENTS.md](../AGENTS.md). Fullstack coordina
React, Node y revisión de lectura únicamente cuando la delegación aporte valor.
No ejecutar todos los agentes por defecto ni permitir ediciones concurrentes
del mismo archivo. Usar el contrato de asignación/entrega del workflow.

Antes de cambiar código, consultar [el inventario](../docs/COMPONENT_INVENTORY.md),
[la arquitectura](../docs/ARCHITECTURE.md),
[el workflow obligatorio](../docs/AI_AGENT_WORKFLOW.md) y
[las buenas prácticas](../docs/BEST_PRACTICES.md).
Seguir Entender → Planificar → Implementar → Verificar → Corregir → Reportar.
Localizar el propietario y los consumidores; reutilizar exports existentes.
Actualizar el inventario en el mismo cambio al crear, borrar, mover o renombrar
piezas o cambiar exports/imports: `npm run inventory:update`, revisar el diff y
`npm run lint:arch`. Las tablas manuales describen responsabilidades y contratos;
el bloque generado registra las fuentes del alcance documentado, no su semántica.

Las reglas por archivo están en [React](instructions/react.instructions.md),
[Node](instructions/node.instructions.md),
[arquitectura](instructions/architecture.instructions.md) y
[testing](instructions/testing.instructions.md). Conservar las reglas del MVP
siguientes sin duplicarlas en cada agente.

No hacer commit/push automáticamente. Instalaciones, movimientos, eliminaciones,
cambios de infraestructura/CI requieren permiso explícito. Ejecutar solo
comprobaciones existentes y autorizadas; reportar PASS, FAIL, BLOCKED y NOT_RUN.

Colores:
- Navy: #0B2038
- Mint: #47DDB9
- Ice: #EAF6FA

Toda la interfaz debe estar en español de España.

## Arquitectura
- Utilizar TypeScript con tipado estricto.
- Separar páginas, componentes, rutas, lógica de negocio y servicios.
- Crear componentes reutilizables.
- Evitar código duplicado y dependencias innecesarias.
- Respetar los diseños y requisitos aprobados en Confluence.
- No implementar funcionalidades fuera del MVP.
- Nunca incluir credenciales ni secretos en el repositorio.

## Accesibilidad

Toda la aplicación debe desarrollarse siguiendo los principios Accessibility First y Testability First.

### HTML semántico
- Utilizar button para acciones y enlaces para navegación.
- Utilizar correctamente main, nav, header, form y table.
- Todos los inputs deben tener labels visibles y asociados.
- Los botones con iconos deben tener nombres accesibles.
- Utilizar aria-current="page" en navegación activa.
- Asociar errores a campos mediante aria-describedby y aria-invalid.
- Utilizar role="alert" para errores importantes y role="status" para mensajes informativos.
- Los diálogos deben gestionar correctamente el foco y el teclado.
- Mantener contraste suficiente y foco visible.

## Formularios
- Mostrar validaciones claras y accesibles.
- Evitar envíos duplicados.
- Gestionar estados de carga, éxito y error.
- Permitir navegación por teclado.
- Confirmar las operaciones destructivas.
- Mantener nombres accesibles consistentes.

## Reglas funcionales del MVP
- Máximo dos miembros por espacio.
- Reparto global 50/50 o proporcional a ingresos.
- Conservar el reparto histórico de gastos existentes.
- Los gastos individuales son privados y no afectan al balance.
- Cada usuario gestiona únicamente sus ingresos.
- Los gastos compartidos pueden consultarlos ambos, pero solo su creador puede modificarlos o eliminarlos.
- Las liquidaciones son manuales, pueden ser parciales y no deben superar la deuda pendiente.
- Conservar el historial de liquidaciones al corregir gastos.
- Permitir consultar meses anteriores.
- Utilizar céntimos enteros para los cálculos monetarios.
- No inventar decisiones de negocio pendientes.

## Estrategia de testing
- Aquí pueden vivir pruebas de desarrollador, como unitarias y tests de tooling.
  El tooling tiene `npm run test:architecture` con node:test. Cliente/servicios
  HTTP tienen `npm run test:unit` y `npm run typecheck:unit` sin conexiones externas.
- Mantener pruebas deterministas, centradas en comportamiento y sin esperas fijas.
- Aplicar validación y autorización en la API Node, no solo en la interfaz.

## Definition of Done
Antes de finalizar cualquier desarrollo:
1. Comprobar accesibilidad y HTML semántico.
2. Verificar etiquetas, nombres accesibles, teclado y estados de formularios.
3. Ejecutar el build existente y autorizado (`pnpm run build` o `npm run build`).
4. Corregir errores de compilación.
5. Resumir los archivos modificados.
