# Gobierno de agentes de DuoBalance

Antes de editar, consultar [instrucciones generales](.github/copilot-instructions.md),
[inventario](docs/COMPONENT_INVENTORY.md), [arquitectura](docs/ARCHITECTURE.md) y
[workflow](docs/AI_AGENT_WORKFLOW.md). Aplicar las instrucciones por archivo.
El código real prevalece sobre una entrada documental desactualizada.

## Equipo

| Agente | Responsabilidad | Herramientas |
| --- | --- | --- |
| [DuoBalance Fullstack Engineer](.github/agents/fullstack-engineer.agent.md) | Entender, planificar, asignar propietarios e integrar/verificar cambios fullstack | Lectura, búsqueda, edición, ejecución y delegación |
| [React Frontend](.github/agents/react-frontend.agent.md) | UI, features, hooks, navegación y adaptadores web | Lectura, búsqueda, edición y ejecución |
| [Node Backend](.github/agents/node-backend.agent.md) | Express, validación, autorización, servicios y MongoDB | Lectura, búsqueda, edición y ejecución |
| [Code Reviewer](.github/agents/code-reviewer.agent.md) | Revisión acotada de riesgos, contratos y consumidores | Solo lectura y búsqueda |

El coordinador puede resolver tareas pequeñas directamente. No lanzar todo el
equipo por defecto. Delegar solo trabajo con contexto independiente y una entrega
concreta; los especialistas no vuelven a delegar. No asignar el mismo archivo a
dos agentes que puedan editarlo simultáneamente.

Los contratos compartidos, tooling e inventario son propiedad del coordinador;
los especialistas proponen cambios cuando afecten a estos archivos. La propiedad
de piezas de código se registra por área en el inventario, no por persona.
Nadie modifica el framework QA desde este encargo.

## Contrato de trabajo

Seguir **Entender → Planificar → Implementar → Verificar → Corregir → Reportar**.
Usar el contrato de asignación y entrega del [workflow](docs/AI_AGENT_WORKFLOW.md).
Actualizar inventario y documentación en el mismo cambio. Separar `PASS`, `FAIL`,
`BLOCKED` y `NOT_RUN`; leer fuentes o recibir una respuesta de un agente no
demuestra que haya pasado una comprobación.

Aquí se permiten unitarias y pruebas de tooling de desarrollador cuando
corresponda; no añadir infraestructura de testing por defecto.

Instalaciones, movimientos/eliminaciones e infraestructura/CI requieren
permiso explícito. No hacer commit ni push sin petición. Conservar cambios ajenos.
Las herramientas restringen capacidades disponibles; los permisos sobre comandos
y el alcance son reglas de conducta, no un bloqueo técnico de cada operación.
