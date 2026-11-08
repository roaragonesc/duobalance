---
name: repository-audit
description: "Use when auditing DuoBalance architecture, inventory drift, ownership, duplication or technical debt. Inspect real sources and report prioritized evidence without modifying application code."
---

# Auditoría de repositorio

## Alcance

Auditoría de lectura. No modificar código, actualizar automáticamente archivos,
instalar dependencias, mover carpetas, ejecutar suites o cambiar CI por auditar.
Las mejoras requieren un plan y autorización separada.

## Procedimiento

1. Leer [gobierno del equipo](../../../AGENTS.md), [README](../../../README.md),
   [inventario](../../../docs/COMPONENT_INVENTORY.md),
   [arquitectura](../../../docs/ARCHITECTURE.md) y
   [workflow](../../../docs/AI_AGENT_WORKFLOW.md), más instrucciones aplicables.
2. Comparar archivos reales con entradas del inventario: faltantes, huérfanas,
   responsabilidades y consumidores. Excluir dependencias, builds y secretos.
3. Trazar imports y puntos de entrada públicos. Comprobar propietarios,
   cruces web/API, dependencias de paquetes y ciclos; distinguir evidencia de
   hipótesis. Consultar el alcance AST y sus exclusiones en arquitectura:
   no atribuir controles semánticos de DTOs, seguridad o módulos fuera del grafo.
4. Buscar duplicidades concretas y deuda técnica. Considerar primero helpers y
   APIs existentes; no recomendar una nueva abstracción sin necesidad real.
5. Consultar scripts reales. Ejecutar controles solo con autorización y registrar
   comandos, resultados y limitaciones. No ejecutar despliegues por defecto.
6. Priorizar por impacto, probabilidad y coste de corrección. Reportar archivo,
   ubicación, evidencia, consumidor afectado y propuesta mínima para cada hallazgo.
7. Separar estado actual de objetivo; entregar plan para aprobación sin aplicar
   cambios. Clasificar verificaciones PASS, FAIL, BLOCKED o NOT_RUN.
